import { MyBaseReteNode } from './MyBaseReteNode';

export class GenreClassifierNode extends MyBaseReteNode {
  constructor(initialCustomData = {}) {
    super('Genre Classifier', { customData: initialCustomData });
    this.addInputWithLabel('audio', 'Audio');
    this.addOutputWithLabel('genre', 'Genre');
  }

  async data(inputs, context) {
    const audio = inputs.audio[0];
    if (audio) {
      const formData = new FormData();
      formData.append('file', audio);
      try {
        const response = await fetch('/api/ml/classify-genre', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return { genre: data.genre };
      } catch (error) {
        console.error('Error classifying genre:', error);
        return { genre: null };
      }
    }
    return { genre: null };
  }
}
