# Obsidian AI Translator

An Obsidian plugin to translate your notes using multiple Large Language Models (LLMs) while preserving formatting and providing a seamless comparison view.

## Features

- **Multi-Provider Support**: Seamlessly switch between major LLM providers:
    - OpenAI (e.g., GPT-4o, GPT-3.5-turbo)
    - Google AI (e.g., Gemini Pro)
    - Anthropic (e.g., Claude 3.5 Sonnet, Claude 2.1)
    - Deepseek
    - Mistral
    - OpenRouter
    - Azure OpenAI
    - Ollama
    - LMStudio
- **Interactive Sidebar**: A dedicated sidebar for easy access to translation controls, real-time progress updates, and detailed logs.
- **Real-time Progress & Logging**: Monitor translation progress with a visual bar and detailed log messages directly in the sidebar.
- **Cancellation**: Stop ongoing translation processes at any time.
- **API Connection Test**: A dedicated button in settings to verify your API key and endpoint configuration.
- **Format Preservation**: Translates the content of your notes while meticulously preserving the original Markdown formatting. **The translation prompt explicitly instructs the LLM to maintain the original document structure and only translate the content without modifying the original text.**
- **Side-by-Side Comparison**: After translation, the translated note automatically opens in a new, split-screen pane for easy and immediate comparison with the original document.
- **Advanced Configuration**: Fine-tune the translation process to your needs:
    - **Model Selection**: Choose the specific model for each provider.
    - **Temperature Control**: Adjust the creativity and randomness of the translation.
    - **Max Tokens**: Set a limit on the length of the translation.
    - **Custom Endpoint**: Specify a custom API endpoint for providers like Azure OpenAI, Ollama, and LMStudio.
- **Custom Output Path**: Specify a custom directory to store your translated files.

## Getting Started

### Installation

1.  Download the `main.js`, `manifest.json`, and `styles.css` from the latest release.
2.  Create a new folder named `obsidian-ai-translator` in your Obsidian vault's plugins folder (`<YourVault>/.obsidian/plugins/`).
3.  Copy the downloaded files into this new folder.
4.  Reload Obsidian.
5.  Go to `Settings` > `Community plugins`, and enable "AI Translator".

### Configuration

1.  Open the settings for the "AI Translator" plugin.
2.  Select your desired **LLM Provider**.
3.  Enter your **API Key** for the selected provider.
4.  (Optional) Customize the **Model**, **Temperature**, **Max Tokens**, and **Output Path** to your preferences.

### How to Translate

1.  Open the note you wish to translate.
2.  Click the new "AI Translator" ribbon icon (looks like a language icon) in the left sidebar to open the plugin sidebar.
3.  Click the "Translate Active File" button in the sidebar.
4.  Alternatively, open the command palette (`Ctrl+P` or `Cmd+P`), search for "Translate and Compare File" and execute the command.
5.  The plugin will translate the document, save it to your specified output path, and open it in a new pane. You can monitor the progress and logs in the sidebar.

## Author

**Jacobinwwey**

- **GitHub**: [https://github.com/Jacobinwwey](https://github.com/Jacobinwwey)
- **Email**: jacob.hxx.cn@outlook.com

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.