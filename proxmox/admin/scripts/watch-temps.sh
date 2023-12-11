#!/bin/bash
watch "sensors | grep '°C' | grep -E 'Core|Sensor|Composite|temp'"
