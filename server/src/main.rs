mod game_state;
mod websocket;

use game_state::{Buttons, GameState, Message, Vector2};
use std::{net::SocketAddr, time::Duration};
use tokio::{net::TcpListener, time};

const PHYSICS_UPDATE_RATE: Duration = Duration::from_millis(16); // ~60 FPS

#[tokio::main]
async fn main() {
    env_logger::init();

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    println!("Game Server Started on: {}", addr);
    println!("----------------------------------------");

    let players_state = game_state::new_players();

    // Spawn physics update task for multiple players
    let players_for_physics = players_state.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(PHYSICS_UPDATE_RATE);
        loop {
            interval.tick().await;
            let mut players = players_for_physics.lock().await;

            // Update each player's game state (e.g., joystick, buttons, etc.)
            for (_, player_state) in players.iter_mut() {
                update_joysticks(player_state).await;
            }

            // Broadcast all players' states
            let state_msg = serde_json::to_string(&game_state::Message {
                type_: "state".to_string(),
                data: serde_json::to_value(&*players).unwrap(),
            })
            .unwrap();

            websocket::broadcast_message(&state_msg).await;
        }
    });

    // Accept connections for multiple players
    while let Ok((stream, addr)) = listener.accept().await {
        println!("\nNew Client Connection:");
        println!("----------------------------------------");
        println!("Client Address: {}", addr);
        println!("Connection Time: {:?}", time::Instant::now());
        println!("----------------------------------------");

        // Use the connection's address as a player id string.
        let player_id = format!("{}", addr);
        {
            let mut players = players_state.lock().await;
            players.insert(player_id.clone(), game_state::GameState::new_default());
        }
        let players_state_clone = players_state.clone();
        tokio::spawn(websocket::handle_connection(
            stream,
            addr,
            players_state_clone,
            player_id,
        ));
    }
}

async fn update_joysticks(state: &mut GameState) {
    // Update joystick values from the game state
    // Ensure values are clamped between -1 and 1
    state.joystick.x = state.joystick.x.clamp(-1.0, 1.0);
    state.joystick.y = state.joystick.y.clamp(-1.0, 1.0);

    // Process button states

    // Create state message with both joystick and button data
    let state_msg = serde_json::to_string(&Message {
        type_: "state".to_string(),
        data: serde_json::to_value(&GameState {
            joystick: Vector2 {
                x: state.joystick.x,
                y: state.joystick.y,
            },
            buttons: Buttons {
                a: state.buttons.a,
                b: state.buttons.b,
                x: state.buttons.x,
                y: state.buttons.y,
            },
        })
        .unwrap(),
    })
    .unwrap();

    // Broadcast the complete state
    websocket::broadcast_message(&state_msg).await;
}

// Helper function to print received messages
#[allow(unused_variables)]
pub fn print_received_message(_addr: SocketAddr, _msg_type: &str, data: &serde_json::Value) {
    let _game_state: GameState = serde_json::from_value(data.clone()).unwrap();
}
