# Obsidian AI Translator

An Obsidian plugin to translate your notes using multiple Large Language Models (LLMs) while preserving formatting and providing a seamless comparison view.

## Features

- **Multi-Provider Support**: Seamlessly switch between major LLM providers:
    - OpenAI (e.g., GPT-4o, GPT-3.5-turbo)
    - Google AI (e.g., Gemini Pro)
    - Anthropic (e.g., Claude 3.5 Sonnet, Claude 2.1)
- **Format Preservation**: Translates the content of your notes while meticulously preserving the original Markdown formatting.
- **Side-by-Side Comparison**: After translation, the translated note automatically opens in a new, split-screen pane for easy and immediate comparison with the original document.
- **Advanced Configuration**: Fine-tune the translation process to your needs:
    - **Model Selection**: Choose the specific model for each provider.
    - **Temperature Control**: Adjust the creativity and randomness of the translation.
    - **Max Tokens**: Set a limit on the length of the translation.
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
2.  Open the command palette (`Ctrl+P` or `Cmd+P`).
3.  Search for "Translate and Compare File" and execute the command.
4.  The plugin will translate the document, save it to your specified output path, and open it in a new pane.

## Author

**Jacobinwwey**

- **GitHub**: [https://github.com/Jacobinwwey](https://github.com/Jacobinwwey)
- **Email**: jacob.hxx.cn@outlook.com

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
