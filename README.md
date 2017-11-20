# vscode-discord

> Display your current project on vscode in discord with Reach Presence

![Badge](https://img.shields.io/github/license/maxerbox/vscode-discord.svg)
![Badge](https://img.shields.io/david/maxerbox/vscode-discord.svg)

![Example](https://i.imgur.com/pLLPexT.png)

## Features

* Show up an icon for the current language in the rich embed

* Disable/enable for each workspace

* Strings entirely modifiable

## Requirements

* Windows

* MacOs in test

* Discord client

## Install

* Install the extension

* **Add Visual Studio Code on discord.**

## Extension Settings

This extension contributes the following settings:

* `discord.enable`: enable/disable this extension
* `discord.clientID`: the client ID used by discord-rpc
* `discord.state`: The dicord rich presence state. Default to `Working on {projectName}`. `{projectName}`:workspace name
* `discord.details`: The discord rpc details. Default to `Editing {filename}`. {filename}: filename, {language} : language id.
* `discord.vscodeIconText`: The small icon hint (smallImageText). Default to Visual Studio Code
* `discord.languageIconText`: The hint for the language icon (largeImageText). Default to `{language}` {language} : language id
* `discord.idle`: The default text when there is no editor opened. Default to `idle`
* `discord.iconMap`: The iconMap for the filename extensions
* `discord.interval`: The interval time to update the informations in ms. Default to 3000ms

## Known Issues

* Not displaying on discord : Check out if Visual Studio Code is added as game on the discord client.

## License

The source code is licensed under the [ISC](LICENSE) License.

The icons are licensed under the [Creative Commons - ShareAlike (CC BY-SA)](https://creativecommons.org/licenses/by-sa/4.0/) license.

## Release Notes

### 0.0.1

Initial release of vscode-discord

### 0.0.2

Rewritten Discord Register

-----------------------------------------------------------------------------------------------------------
