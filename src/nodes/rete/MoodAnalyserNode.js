import { MyBaseReteNode } from './MyBaseReteNode';
import { anl } from 'pkg-name';

export class MoodAnalyserNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('Mood Analyser', { customData: initialCustomData });
    this.addInputWithLabel('audio', 'Audio');
    this.addOutputWithLabel('mood', 'Mood');
  }

  async data(inputs, context) {
    const audio = inputs.audio[0];
    if (audio) {
      const formData = new FormData();
      formData.append('file', audio);
      try {
        const response = await fetch('/api/ml/analyze-mood', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return { mood: data.mood };
      } catch (error) {
        console.error('Error analyzing mood:', error);
        return { mood: null };
      }
    }
    return { mood: null };
  }
}
