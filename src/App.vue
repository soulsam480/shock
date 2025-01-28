<script setup lang="ts">
import { ref } from 'vue';


class Device {
	server: BluetoothRemoteGATTServer | null = null
	services: BluetoothRemoteGATTService[] = []

	constructor(readonly ble: BluetoothDevice) {
		ble.addEventListener("gattserverdisconnected", () => {
			console.log("gattserverdisconnected", this.ble.name)
		})
	}

	get name() {
		return this.ble.name
	}

	get connected() {
		return this.ble.gatt?.connected || false
	}

	async connect() {
		this.server = await this.ble.gatt?.connect() || null
		this.services = await this.server?.getPrimaryServices() || []
	}

	disconnect() {
		this.ble.gatt?.disconnect()
	}
}


const device = ref<Device | null>(null)

async function onButtonClick() {

	try {
		const dev = await navigator.bluetooth.requestDevice({
			filters: [{ namePrefix: "CASIO", services: ["00001804-0000-1000-8000-00805f9b34fb"] }],
			optionalServices: ["26eb000d-b012-49a8-b1f8-394fb2032b0f"]
		})

		device.value = new Device(dev)

		await device.value.connect()
	} catch (error) {
		console.log(error)
	}
}
</script>

<template>
	<div>

		<button @click="onButtonClick">
			Ask
		</button>

		<div v-if="device?.ble">
			<p>{{ device.name }}</p>
			<p>{{ device.connected }}</p>
		</div>
	</div>
</template>

<style scoped></style>
