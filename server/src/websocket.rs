use crate::game_state::{GameState, Message};
use crate::print_received_message;
use serde_json::Value;

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{accept_async, tungstenite::Message as WsMessage};

// Global state for connected clients (each client sender mapped by their SocketAddr)
lazy_static::lazy_static! {
    static ref CLIENTS: Mutex<HashMap<SocketAddr, futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<TcpStream>, WsMessage>>> = Mutex::new(HashMap::new());
}

pub async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    players_state: Arc<Mutex<HashMap<String, GameState>>>,
    player_id: String,
) -> Result<()> {
    let mut is_player = false;
    let ws_stream = accept_async(stream)
        .await
        .expect("Failed to accept websocket");

    let (ws_sender, mut ws_receiver) = ws_stream.split();

    // Store the sender part of the websocket
    CLIENTS.lock().await.insert(addr, ws_sender);

    // Send the initial global state
    let state = players_state.lock().await;
    let msg = serde_json::to_string(&Message {
        type_: "state".to_string(),
        data: serde_json::to_value(&*state).unwrap(),
    })
    .unwrap();
    broadcast_message(&msg).await;
    drop(state);

    // Handle incoming messages
    while let Some(result) = ws_receiver.next().await {
        match result {
            Ok(msg) => {
                if let WsMessage::Text(text) = msg {
                    if let Ok(message) = serde_json::from_str::<Message>(&text) {
                        // Log received messages in a compact format
                        match message.type_.as_str() {
                            "register" => {
                                if let Ok(data) =
                                    serde_json::from_value::<Value>(message.data.clone())
                                {
                                    if let Some(role) = data.get("role").and_then(|r| r.as_str()) {
                                        is_player = role == "player";
                                        println!(
                                            "Register {}: {} ({})",
                                            if is_player { "player" } else { "viewer" },
                                            addr,
                                            role
                                        );

                                        // Only create game state for players
                                        if is_player {
                                            let mut players = players_state.lock().await;
                                            players.insert(
                                                player_id.clone(),
                                                GameState::new_default(),
                                            );
                                        }
                                    }
                                }
                            }
                            "action" => {
                                // Only process actions from players
                                if is_player {
                                    let mut players = players_state.lock().await;
                                    if let Some(state) = players.get_mut(&player_id) {
                                        if let Ok(action) = serde_json::from_value(message.data) {
                                            *state = action;
                                            let state_msg = serde_json::to_string(&Message {
                                                type_: "state".to_string(),
                                                data: serde_json::to_value(&*players).unwrap(),
                                            })
                                            .unwrap();
                                            broadcast_message(&state_msg).await;
                                        }
                                    }
                                }
                            }
                            "readstate" => {
                                let state = players_state.lock().await;
                                let state_msg = serde_json::to_string(&Message {
                                    type_: "state".to_string(),
                                    data: serde_json::to_value(&*state).unwrap(),
                                })
                                .unwrap();
                                broadcast_message(&state_msg).await;
                            }
                            _ => println!("Unknown message type from {}: {}", addr, message.type_),
                        }
                    }
                }
            }
            Err(e) => {
                println!("Error receiving message for {}: {}", addr, e);
                break;
            }
        }
    }

    // Clean up when client disconnects
    CLIENTS.lock().await.remove(&addr);
    println!("Client {} disconnected", addr);

    // Remove the player's state from the shared players map only if they were a player
    if is_player {
        let mut players = players_state.lock().await;
        players.remove(&player_id);
    }

    Ok(())
}

// Helper function to broadcast a message to all clients
pub async fn broadcast_message(message: &str) {
    let mut clients = CLIENTS.lock().await;
    let mut failed_clients = Vec::new();

    for (&addr, sender) in clients.iter_mut() {
        if let Err(e) = sender.send(WsMessage::Text(message.to_string())).await {
            println!("Failed to send to client {}: {}", addr, e);
            failed_clients.push(addr);
        }
    }
    for addr in failed_clients {
        clients.remove(&addr);
        println!("Removed disconnected client {}", addr);
    }
}
