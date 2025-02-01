<script setup lang="ts">
import { GShockConstants, IGShockManager } from './lib';

async function onButtonClick() {
	try {
		const device = await navigator.bluetooth.requestDevice({
			acceptAllDevices: false,
			filters: [{ services: [GShockConstants.CASIO_SERVICE_UUID,] }],
			optionalServices: [GShockConstants.ALL_FEATURES_SERVICE_UUID]
		});
		const manager = new IGShockManager();
		await manager.connect(device);
		const watchName = await manager.fetchWatchName();
		console.log("Watch Name:", watchName);
	} catch (error) {
		console.error("Error during execution:", error);
	}
}
</script>

<template>
	<div>

		<button @click="onButtonClick">
			Connect
		</button>

		<!-- <div v-if="device?.ble"> -->
		<!-- 	<p>{{ device.name }}</p> -->
		<!-- 	<p>{{ device.connected }}</p> -->
		<!-- </div> -->
	</div>
</template>

<style scoped></style>
