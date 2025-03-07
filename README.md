[![](https://vsmarketplacebadge.apphb.com/version/SanderRonde.phpstan-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=SanderRonde.phpstan-vscode)
[![](https://vsmarketplacebadge.apphb.com/installs-short/SanderRonde.phpstan-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=SanderRonde.phpstan-vscode)
[![](https://vsmarketplacebadge.apphb.com/rating-short/SanderRonde.phpstan-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=SanderRonde.phpstan-vscode)

## Features

-   Automatically runs PHPStan of your code and highlights errors as you type.
-   Adds command for running project-wide analysis and displays all errors in the `Diagnostics` tab.
-   Shows the values of variables according to PHPStan at the point of hovering.

https://user-images.githubusercontent.com/5385012/188924277-c9392477-9bd6-40b1-9ed7-eb892da1fe0f.mp4

## Configuration

### Main Config

-   `phpstan.configFile` - path to the config file, either relative to `phpstan.rootDir` or absolute. Use a comma-separated list to resolve in the listed order. For example if `phpstan.neon,phpstan.neon.dist` is used, the extension will first try to use `phpstan.neon` if it exists and fall back to `phpstan.neon.dist`.
-   `phpstan.rootDir` - path to the root directory of your PHP project (defaults to `workspaceFolder`)
-   `phpstan.binPath` - path to the PHPStan binary (defaults to `${workspaceFolder}/vendor/bin/phpstan`)
-   `phpstan.binCommand` - command that runs the PHPStan binary. Use this if, for example, PHPStan is already in your global path. If this is specified, it is used instead of `phpstan.binPath`. Unset by default.

### Tuning

-   `phpstan.options` - array of command line options to pass to PHPStan (defaults to `[]`)
-   `phpstan.memoryLimit` - memory limit to use when running PHPStan (defaults to `1G`)
-   `phpstan.timeout` - timeout for checking single files after which the PHPStan process is killed in ms (defaults to 10000ms)
-   `phpstan.projectTimeout` - timeout for checking the entire project after which the PHPStan process is killed in ms (defaults to 60000ms)
-   `phpstan.suppressTimeoutMessage` - whether to disable the error message when the check times out (defaults to `false`)
-   `phpstan.paths` - path mapping that allows for rewriting paths. Can be useful when developing inside a docker container or over SSH. Unset by default. Example for making the extension work in a docker container: `{ "/path/to/hostFolder": "/path/in/dockerContainer" }`
-   `phpstan.ignoreErrors` - An array of regular expressions to ignore in error messages. If you find the PHPStan process erroring often because of a warning that can be ignored, put the warning in here and it'll be ignored in the future.

### Customization

-   `phpstan.enabled` - whether to enable the on-save checker (defaults to `true`)
-   `phpstan.enableStatusBar` - whether to show a statusbar entry while performing the check (defaults to `true`)
-   `phpstan.enableLanguageServer` - Whether to enable the language server that provides on-hover information. Disable this if you're using a custom PHPStan binary that runs on another filesystem (such as Docker) and you're running into issues (defaults to `true`)
-   `phpstan.showProgress` - whether to show the progress bar when performing a single-file check (defaults to `false`)

## Development

First get your dev environment started by running `yarn dev`. Note that this expects you to have a few programs installed:

-   `composer`
-   `git`
-   `yarn`

This command installs all JS and PHP dependencies and ensures you're ready to go for writing a PHPStan extension.

### Good-to-know commands

The following command will run PHPStan on a demo file, this is handy for testing out changes to the PHPStan plugin that collects hover data.

`php/vendor/bin/phpstan analyze -c php/config.neon -a php/TreeFetcher.php --debug test/demo/php/DemoClass.php`
