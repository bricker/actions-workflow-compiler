# Github Workflow Compiler

As Github Actions is relatively new, there are some limitations in the Workflow syntax that this package attempts to fix. My hope is that this package becomes obsolete as Github adds these features to Github Actions.

## How to use this system

- "Source" files are written in JSON and live at `.github/workflows/src/`.
- The `src` directory contains your Workflow definitions (as JSON), as well as a `fragments` directory.

### Example Project Structure

```
| .github >

    | workflows >
        | pr-checks.yml
        | release.yml

        | src >
            | pr-checks.json
            | release.json

            | fragments >
                | checkout.json
                | setup-node.json

```

### Example fragment

src/fragments/setup-node.json

```json
[
  {
    "uses": "actions/setup-node@v1",
    "with": {
      "node-version": "14.17.1"
    }
  },
  {
    "name": "npm cache",
    "uses": "actions/cache@v2",
    "with": {
      "path": "$HOME/.npm",
      "key": "${{ runner.os }}-npm-v1-${{ hashFiles('**/package-lock.json') }}",
      "restore-keys": "${{ runner.os }}-npm-v1-"
    }
  },
  {
    "run": "npm install"
  }
]
```

src/fragments/checkout.json

```json
{
  "uses": "actions/checkout@v2"
}
```

### Example workflow source file

src/pr-checks.json

```json
{
  "name": "PR Checks",
  "on": "pull_request",
  "jobs": {
    "lint": {
      "runs-on": "ubuntu-latest",
      "name": "Lint",
      "steps": [
        "*{{ checkout }}",
        "*{{ setup-node }}",
        {
          "run": "npm run lint"
        }
      ]
    },
    "test": {
      "runs-on": "ubuntu-latest",
      "name": "Test",
      "steps": [
        "*{{ checkout }}",
        "*{{ setup-node }}",
        {
          "run": "npm run test"
        }
      ]
    }
  }
}
```

## Fragments
A fragment can contain any valid JSON data. How it is interpreted by the compiler depends on where it is used.

To reference a fragment, use the syntax: `"*{{ fragmentName }}"`, where `fragmentName` is the basename of the file. Note that the pointer is in a string. Example:

```json
{
  "steps": [
    "*{{ checkout }}",
    {
      "run": "bin/test"
    }
  ]
}
```

A fragment can also be a scalar value, for example:

src/fragments/test-script.json

```json
"bin/test"
```

src/pr-checks.json

```json
{
  "steps": [
    "*{{ checkout }}",
    {
      "run": "*{{ test-script }}"
    }
  ]
}
```

### Array fragments

If a fragment is an array, and it is used inside of another array, the fragment will be _spread_ into the parent array. This allows you define a set of steps, for example, and re-use those in many workflows.

src/fragments/setup-node.json

```json
[
  {
    "uses": "actions/cache@v2",
    "with": {
      "path": "$HOME/.npm",
      "key": "npm-deps"
    }
  },
  {
    "run": "npm install"
  }
]
```

src/pr-lint.json

```json
{
  "steps": [
    "*{{ setup-node }}",
    {
      "run": "npm run lint"
    }
  ]
}
```

In the above example, the `setup-node` fragment will be spread into the `steps` array, resulting in the following in the workflow definition:

```yml
steps:
  - uses: actions/cache@v2
    with:
      path: $HOME/.npm
      key: npm-deps
  - run: npm install
  - run: npm run lint
```

If the array fragment is used inside of an object or as a value of a property, it will retain its Array structure.

### Merging Objects

You can compose an object from object fragments and non-fragments. With this strategy, the contents of an object fragment will be merged into the parent object. This allows you to define groups of configuration that can be applied to many workflows.

The syntax to do this is similar to using fragments in other parts of your source file, except you place the fragment pointer string as the KEY, instead of the VALUE. Because source files must be valid JSON, you must also supply a value. This value is arbitrary and will not be used. An empty string is suggested.

**NOTE**: Because object keys are unordered in javascript, the order in which the fragments are merged is not guaranteed. If the order is important in your setup, use this feature with caution.

src/fragments/api-config.json

```json
{
  "API_USERNAME": "${{ secrets.api_username }}",
  "API_KEY": "${{ secrets.api_key }}",
}
```

src/fragments/network-params.json

```json
{
  "TIMEOUT": 5,
  "RETRIES": 3,
}
```

src/release.json

```json
{
  "steps": [
    {
      "run": "bin/release",
      "env": {
        "*{{ api-config }}": "",
        "*{{ network-params }}": "",
        "RELEASE_TYPE": "beta"
      }
    }
  ]
}
```

The resulting Workflow definition:

```yml
steps:
  - run: bin/release
    env:
      API_USERNAME: "${{ secrets.api_username }}"
      API_KEY: "${{ secrets.api_key }}"
      TIMEOUT: 5
      RETRIES: 3
      RELEASE_TYPE: beta
```

## How to make a change to a workflow

The final `yml` files are compiled from the JSON source (in `src`) and output into `.github/workflows`. You should only edit the `json` files, as any changes you make the the `yml` will be overwritten. The `yml` files must be committed to source control because GitHub uses the checked-in workflow files.

When you're done making your changes to the JSON source files, run `npx compile-workflows`. The script will generate new `yml` files from the JSON source.

## Limitations

Currently unsupported features:

1. Fragments are all-or-nothing and do not take any type of configuration or parameters.
2. If a fragment is used in the middle of a string, the entire string will be replaced.
