"""Hardware Abstraction Layer: interfaces + selectable adapters.
Business logic depends only on these Protocols; swapping hardware never touches services."""
from typing import Protocol, Dict
from config import VAANI_HARDWARE


class IMicrophone(Protocol):
    def capabilities(self) -> Dict: ...


class ISpeaker(Protocol):
    def capabilities(self) -> Dict: ...


class HardwareProfile:
    name: str = "mock"
    description: str = ""
    capabilities: Dict = {}


class MockHardware(HardwareProfile):
    name = "mock"
    description = "Cloud / browser environment. Audio I/O handled client-side (Web APIs)."
    capabilities = {
        "microphone": {"available": True, "driver": "web-mediarecorder"},
        "speaker": {"available": True, "driver": "web-audio"},
        "camera": {"available": False, "driver": None},
        "gpio": {"available": False, "driver": None},
        "display": {"available": True, "driver": "browser"},
    }


class LaptopHardware(HardwareProfile):
    name = "laptop"
    description = "Developer laptop. OS default microphone and speaker."
    capabilities = {
        "microphone": {"available": True, "driver": "os-default"},
        "speaker": {"available": True, "driver": "os-default"},
        "camera": {"available": True, "driver": "os-webcam"},
        "gpio": {"available": False, "driver": None},
        "display": {"available": True, "driver": "os-window"},
    }


class RaspberryPiHardware(HardwareProfile):
    name = "raspberry_pi"
    description = "Raspberry Pi kiosk. arecord/aplay audio, GPIO buttons/LEDs, touch display."
    capabilities = {
        "microphone": {"available": True, "driver": "alsa-arecord"},
        "speaker": {"available": True, "driver": "alsa-aplay"},
        "camera": {"available": True, "driver": "picamera2"},
        "gpio": {"available": True, "driver": "rpi.gpio"},
        "display": {"available": True, "driver": "dsi-touch"},
    }


class ESP32Hardware(HardwareProfile):
    name = "esp32"
    description = "ESP32 edge node. I2S mic/DAC over serial/MQTT bridge."
    capabilities = {
        "microphone": {"available": True, "driver": "i2s-serial"},
        "speaker": {"available": True, "driver": "i2s-dac"},
        "camera": {"available": False, "driver": None},
        "gpio": {"available": True, "driver": "esp32-gpio"},
        "display": {"available": True, "driver": "spi-oled"},
    }


_ADAPTERS = {
    "mock": MockHardware,
    "laptop": LaptopHardware,
    "raspberry_pi": RaspberryPiHardware,
    "esp32": ESP32Hardware,
}


def get_hardware() -> HardwareProfile:
    return _ADAPTERS.get(VAANI_HARDWARE, MockHardware)()
