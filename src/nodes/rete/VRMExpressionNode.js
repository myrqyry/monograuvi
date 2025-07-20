import { BaseVisualReteNode } from './BaseVisualReteNode';
import * as THREE from 'three';

export class VRMExpressionReteNode extends BaseVisualReteNode {
  constructor(initialCustomData = {}) {
    super('VRM Expression', { visualType: 'vrm-expression', customData: initialCustomData });

    this.addInputWithLabel('audioData', 'Audio Data');
    this.addInputWithLabel('vrm', 'VRM');

    this.addControlWithLabel('expression', 'select', 'Expression', {
      initial: 'happy',
      options: ['happy', 'sad', 'angry', 'relaxed', 'aa', 'ih', 'ou', 'ee', 'oh']
    });
    this.addControlWithLabel('sensitivity', 'number', 'Sensitivity', {
      initial: 1.0,
      min: 0.1,
      max: 5.0,
      step: 0.1
    });
  }

  data(inputs) {
    const audioData = inputs.audioData?.[0];
    const vrm = inputs.vrm?.[0];
    const expression = this.getProperty('expression');
    const sensitivity = this.getProperty('sensitivity');

    if (vrm && audioData) {
      const { expressionManager } = vrm;
      if (expressionManager) {
        // Normalize audio level (assuming it's in a 0-1 range)
        const audioLevel = audioData.volume || 0;
        expressionManager.setValue(expression, audioLevel * sensitivity);
      }
    }
  }
}
