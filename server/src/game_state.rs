use serde::{Deserialize, Serialize};
use std::{fmt, sync::Arc};
use tokio::sync::Mutex;

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
    pub fn new() -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(Self {
            joystick: Vector2 { x: 0.0, y: 0.0 },
            buttons: Buttons {
                a: false,
                b: false,
                x: false,
                y: false,
            },
        }))
    }
}

#[derive(Serialize, Deserialize)]
pub struct Message {
    #[serde(rename = "type")]
    pub type_: String,
    pub data: serde_json::Value,
}
