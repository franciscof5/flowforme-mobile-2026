/**
 * Audio input selection, isolated from the camera/recording code.
 *
 * Only the device's built-in microphone is wired up for now. The module is kept
 * deliberately small (a list plus a selected input) so a Bluetooth input can be
 * plugged in later without touching the rest of the camera pipeline.
 *
 * Bluetooth is intentionally NOT implemented in this stage.
 */

export type AudioInputKind = 'built-in' | 'bluetooth';

export interface AudioInput {
  id: string;
  label: string;
  kind: AudioInputKind;
  available: boolean;
}

export const BUILT_IN_AUDIO_INPUT: AudioInput = {
  id: 'built-in-mic',
  label: 'Microfone do aparelho',
  kind: 'built-in',
  available: true,
};

/**
 * Inputs currently selectable. Once Bluetooth support lands, discovered
 * Bluetooth microphones will be appended here.
 */
export function listAudioInputs(): AudioInput[] {
  return [BUILT_IN_AUDIO_INPUT];
}

/** The input used for new recordings. */
export function getSelectedAudioInput(): AudioInput {
  return BUILT_IN_AUDIO_INPUT;
}

/** Resolves an input by id, falling back to the built-in microphone. */
export function selectAudioInput(id: string): AudioInput {
  return listAudioInputs().find((input) => input.id === id) ?? BUILT_IN_AUDIO_INPUT;
}

/** Bluetooth audio capture is not available yet. */
export function isBluetoothAudioSupported(): boolean {
  return false;
}
