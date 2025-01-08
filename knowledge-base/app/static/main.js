import { createApp } from 'vue'

const app = createApp({
    data() {
        return {
            currentView: 'documents',
            settings: {
                chunkSize: 10000,
                chunkOverlap: 200
            },
            chunks: [],
            documents: []
        }
    },
    methods: {
        async handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.documents.push(result);
                    this.loadChunks();
                } else {
                    console.error('Upload failed');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        },

        async saveSettings() {
            try {
                const response = await fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.settings)
                });

                if (response.ok) {
                    alert('Settings saved successfully');
                } else {
                    console.error('Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        },

        async loadChunks() {
            try {
                const response = await fetch('/api/chunks');
                if (response.ok) {
                    this.chunks = await response.json();
                }
            } catch (error) {
                console.error('Error loading chunks:', error);
            }
        }
    },
    mounted() {
        this.loadChunks();
    }
}).mount('#app')
