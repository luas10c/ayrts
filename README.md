# Ayrts

Installation
```sh
$ npm install ayrts -D
```

Use
```sh
ayrts [options] src/main.ts
```

Options:
```
--watch: Runs the TypeScript file in watch mode, restarting the process whenever the file changes.
``````

Example
``````
To transpile and run the src/main.ts file, use the following command:

ayrts src/main.ts
This will generate a src/main.js file and run it.

To run the src/main.ts file in watch mode, use the following command:

ayrts --watch src/main.ts
This will start a process that will transpile and run the src/main.ts file whenever it changes.
``````

Contributions

Contributions are welcome! To contribute, open an issue or pull request in the project's GitHub repository.

Licensing

ayrts is licensed under the MIT License.