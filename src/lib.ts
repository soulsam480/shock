export class GShockConstants {
	static CASIO_SERVICE_UUID: string = "00001804-0000-1000-8000-00805f9b34fb";
	static ALL_FEATURES_SERVICE_UUID: string =
		"26eb000d-b012-49a8-b1f8-394fb2032b0f";

	static ALL_FEATURES_CHARACTERISTICS_UUID =
		"26eb002c-b012-49a8-b1f8-394fb2032b0f";

	static ALL_FEATURES = [
		"26eb0023-b012-49a8-b1f8-394fb2032b0f",
		"26eb0024-b012-49a8-b1f8-394fb2032b0f",
		"26eb002c-b012-49a8-b1f8-394fb2032b0f",
		"26eb002d-b012-49a8-b1f8-394fb2032b0f",
		"26eb002e-b012-49a8-b1f8-394fb2032b0f",
		"26eb002f-b012-49a8-b1f8-394fb2032b0f",
		"26eb0030-b012-49a8-b1f8-394fb2032b0f",
	];
}

function hexStringToArrayBuffer(hexString: string) {
	// Remove the leading '0x' if present
	hexString = hexString.replace(/^0x/, "");

	// Ensure the string has an even number of characters
	if (hexString.length % 2 !== 0) {
		throw new Error("Hex string must have an even length");
	}

	// Create a Uint8Array to hold the bytes
	const byteArray = new Uint8Array(hexString.length / 2);

	for (let i = 0; i < hexString.length; i += 2) {
		// Convert each pair of hex characters to a byte
		byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
	}

	// Return the underlying ArrayBuffer
	return byteArray.buffer;
}

function dataViewToString(dataView: DataView, encoding = "utf-8") {
	// Create a TextDecoder instance with the specified encoding
	const decoder = new TextDecoder(encoding);

	// Decode the DataView and return the resulting string
	return decoder.decode(dataView);
}

export class IGShockManager {
	private device: BluetoothDevice | null = null;
	private server: BluetoothRemoteGATTServer | null = null;
	private service: BluetoothRemoteGATTService | null = null;
	private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> =
		new Map();

	async connect(device: BluetoothDevice): Promise<void> {
		try {
			this.device = device;
			this.server = await device.gatt!.connect();
			this.service = await this.server.getPrimaryService(
				GShockConstants.ALL_FEATURES_SERVICE_UUID,
			);
			console.log("Connected to:", device.name);

			// for (const [key, uuid] of Object.entries(
			// 	GShockConstants.CHARACTERISTICS,
			// )) {
			// 	const characteristic = await this.service.getCharacteristic(uuid);
			// 	console.log(key, characteristic);
			// 	this.characteristics.set(key, characteristic);
			// }

			for (const char of await this.service.getCharacteristics()) {
				this.characteristics.set(char.uuid, char);
				char.oncharacteristicvaluechanged = this.handleChar(char.uuid);

				if (char.properties.notify) {
					await char.startNotifications();
				}

				try {
					console.log(await char.readValue());
				} catch (error) {
					console.log("AAA", error);
				}
			}
		} catch (error) {
			console.error("Connection failed:", error);
		}
	}

	handleChar(uuid: string) {
		return (event: Event) => {
			console.log("LOG from", uuid, event);

			if (event instanceof Event && event.target.value) {
				console.log(
					"with data",
					dataViewToString(event.target.value as DataView),
				);
			}
		};
	}

	async disconnect(): Promise<void> {
		if (this.device && this.device.gatt?.connected) {
			this.device.gatt.disconnect();
			console.log("Disconnected from device");
		}
	}

	async readCharacteristic(data: string): Promise<void> {
		try {
			const characteristic = await this.service?.getCharacteristic(
				GShockConstants.ALL_FEATURES_CHARACTERISTICS_UUID,
			);

			if (!characteristic) throw new Error("Characteristic not found");

			await characteristic.writeValue(hexStringToArrayBuffer(data));
		} catch (error) {
			console.error("Failed to read characteristic:", error);
		}
	}

	async writeCharacteristic(
		characteristicUUID: string,
		data: string,
	): Promise<void> {
		try {
			const characteristic = this.characteristics.get(characteristicUUID);
			if (!characteristic) throw new Error("Characteristic not found");
			const encoder = new TextEncoder();
			await characteristic.writeValue(encoder.encode(data));
			console.log("Data written successfully");
		} catch (error) {
			console.error("Failed to write characteristic:", error);
		}
	}

	async fetchWatchName(): Promise<void> {
		await this.readCharacteristic("0x12");
	}
}
