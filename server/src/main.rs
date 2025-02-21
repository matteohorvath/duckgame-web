mod game_state;
mod websocket;

use std::{net::SocketAddr, time::Duration};
use tokio::{net::TcpListener, time};
use game_state::{GameState, Message, Buttons, Vector2};

const PHYSICS_UPDATE_RATE: Duration = Duration::from_millis(16); // ~60 FPS

#[tokio::main]
async fn main() {
    env_logger::init();
    
    let addr = SocketAddr::from(([192, 168, 0, 82], 3001));
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    println!("Game Server Started on: {}", addr);
    println!("----------------------------------------");

    let game_state = game_state::GameState::new();
    
    // Spawn physics update task
    let physics_state = game_state.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(PHYSICS_UPDATE_RATE);
        loop {
            interval.tick().await;
            let mut state = physics_state.lock().await;
            
            update_joysticks(&mut state).await;
            
            // Broadcast updated state
            let state_msg = serde_json::to_string(&Message {
                type_: "state".to_string(),
                data: serde_json::to_value(&*state).unwrap(),
            })
            .unwrap();
            
            websocket::broadcast_message(&state_msg).await;
        }
    });

    // Accept connections
    while let Ok((stream, addr)) = listener.accept().await {
        println!("\nNew Client Connection:");
        println!("----------------------------------------");
        println!("Client Address: {}", addr);
        println!("Connection Time: {:?}", time::Instant::now());
        println!("----------------------------------------");

        let game_state = game_state.clone();
        tokio::spawn(websocket::handle_connection(stream, addr, game_state));
    }
}

async fn update_joysticks(state: &mut GameState) {
    // Update joystick values from the game state
    // Ensure values are clamped between -1 and 1
    state.joystick.x = state.joystick.x.clamp(-1.0, 1.0);
    state.joystick.y = state.joystick.y.clamp(-1.0, 1.0);

    // Process button states
    if state.buttons.a {
        println!("Button A pressed");
    }
    if state.buttons.b {
        println!("Button B pressed");
    }
    if state.buttons.x {
        println!("Button X pressed");
    }
    if state.buttons.y {
        println!("Button Y pressed");
    }

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