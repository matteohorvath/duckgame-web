use crate::game_state::{GameState, Message};
use crate::print_received_message;

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::{net::TcpStream, sync::Mutex};
use tokio_tungstenite::{accept_async, tungstenite::Message as WsMessage};

// Global state for connected clients
lazy_static::lazy_static! {
    static ref CLIENTS: Mutex<HashMap<SocketAddr, futures_util::stream::SplitSink<tokio_tungstenite::WebSocketStream<TcpStream>, WsMessage>>> = Mutex::new(HashMap::new());
}

pub async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    players_state: Arc<Mutex<HashMap<String, GameState>>>,
    player_id: String,
) -> Result<()> {
    let ws_stream = accept_async(stream)
        .await
        .expect("Failed to accept websocket");

    let (ws_sender, mut ws_receiver) = ws_stream.split();

    // Store the sender part of the websocket
    CLIENTS.lock().await.insert(addr, ws_sender);

    // Send initial state
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
                        print_received_message(addr, &message.type_, &message.data);

                        match message.type_.as_str() {
                            "action" => {
                                let mut players = players_state.lock().await;
                                if let Some(state) = players.get_mut(&player_id) {
                                    if let Ok(action) = serde_json::from_value(message.data) {
                                        *state = action;

                                        // Broadcast new state to all clients
                                        let state_msg = serde_json::to_string(&Message {
                                            type_: "state".to_string(),
                                            data: serde_json::to_value(&*state).unwrap(),
                                        })
                                        .unwrap();

                                        broadcast_message(&state_msg).await;
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
                            _ => println!("Unknown message type: {}", message.type_),
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

    Ok(())
}

// Helper function to broadcast message to all clients
pub async fn broadcast_message(message: &str) {
    let mut clients = CLIENTS.lock().await;

    // Collect clients that error out for removal
    let mut failed_clients = Vec::new();

    for (&addr, sender) in clients.iter_mut() {
        if let Err(e) = sender.send(WsMessage::Text(message.to_string())).await {
            println!("Failed to send to client {}: {}", addr, e);
            failed_clients.push(addr);
        }
    }

    // Remove failed clients
    for addr in failed_clients {
        clients.remove(&addr);
        println!("Removed disconnected client {}", addr);
    }
}
