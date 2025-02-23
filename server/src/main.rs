mod game_state;
mod websocket;

use game_state::{GameState, Message, SharedPlayers};
use std::{net::SocketAddr, time::Duration};
use tokio::{net::TcpListener, time};

const PHYSICS_UPDATE_RATE: Duration = Duration::from_millis(16); // ~60 FPS

#[tokio::main]
async fn main() {
    env_logger::init();

    // Listen on all interfaces so that clients anywhere can connect.
    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");
    println!("Game Server Started on: {}", addr);
    println!("----------------------------------------");

    // Create a shared players map (PDR)
    let players_state: SharedPlayers = game_state::new_players();

    // Spawn physics update task for multiple players (Ticker)
    let players_for_physics = players_state.clone();
    tokio::spawn(async move {
        let mut interval = time::interval(PHYSICS_UPDATE_RATE);
        loop {
            interval.tick().await;
            let mut players = players_for_physics.lock().await;

            // Update each player's game state (e.g. ensure joystick values are clamped)
            for (_id, player_state) in players.iter_mut() {
                update_joysticks(player_state).await;
            }

            // Print compact player states (only if there are players)
            if !players.is_empty() {
                let states: Vec<_> = players
                    .iter()
                    .map(|(id, state)| {
                        format!(
                            "{}:[j({:.1},{:.1}),b({}{}{}{})]",
                            id.split(':').next().unwrap_or(id), // Take first part of IP:PORT
                            state.joystick.x,
                            state.joystick.y,
                            if state.buttons.a { "A" } else { "-" },
                            if state.buttons.b { "B" } else { "-" },
                            if state.buttons.x { "X" } else { "-" },
                            if state.buttons.y { "Y" } else { "-" },
                        )
                    })
                    .collect();
                println!("Players: {}", states.join(" "));
            }

            // Broadcast ALL players' states in one message (global state update)
            let state_msg = serde_json::to_string(&Message {
                type_: "state".to_string(),
                data: serde_json::to_value(&*players).unwrap(),
            })
            .unwrap();

            websocket::broadcast_message(&state_msg).await;
        }
    });

    // Accept connections for multiple players.
    while let Ok((stream, addr)) = listener.accept().await {
        println!("\nNew Client Connection:");
        println!("----------------------------------------");
        println!("Client Address: {}", addr);
        println!("Connection Time: {:?}", time::Instant::now());
        println!("----------------------------------------");

        // Use the connection's address as a unique player id
        let player_id = format!("{}", addr);
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
    // Clamp joystick values between -1 and 1
    state.joystick.x = state.joystick.x.clamp(-1.0, 1.0);
    state.joystick.y = state.joystick.y.clamp(-1.0, 1.0);

    // (Additional physics or button handling can be added here.)
}

#[allow(unused_variables)]
pub fn print_received_message(_addr: SocketAddr, _msg_type: &str, data: &serde_json::Value) {
    // For debugging: print deserialized GameState if needed.
    let _game_state: GameState = serde_json::from_value(data.clone()).unwrap();
}
