use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{fmt, sync::Arc};
use tokio::sync::Mutex;

/// A shared map of player id to that player's game state.
pub type SharedPlayers = Arc<Mutex<HashMap<String, GameState>>>;

#[derive(Clone, Serialize, Deserialize)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32,
}

impl fmt::Debug for Vector2 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({:.2}, {:.2})", self.x, self.y)
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct GameState {
    pub joystick: Vector2,
    pub buttons: Buttons,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Buttons {
    pub a: bool,
    pub b: bool,
    pub x: bool,
    pub y: bool,
}

impl fmt::Debug for Buttons {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "(a: {}, b: {}, x: {}, y: {})",
            self.a, self.b, self.x, self.y
        )
    }
}

impl fmt::Debug for GameState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "GameState {{ joystick: {:?}, buttons: {:?} }}",
            self.joystick, self.buttons
        )
    }
}

impl GameState {
    /// Create a default game state for a new player.
    pub fn new_default() -> GameState {
        GameState {
            joystick: Vector2 { x: 0.0, y: 0.0 },
            buttons: Buttons {
                a: false,
                b: false,
                x: false,
                y: false,
            },
        }
    }
}

/// Create a shared players map.
pub fn new_players() -> SharedPlayers {
    Arc::new(Mutex::new(HashMap::new()))
}

#[derive(Serialize, Deserialize)]
pub struct Message {
    #[serde(rename = "type")]
    pub type_: String,
    pub data: serde_json::Value,
}
