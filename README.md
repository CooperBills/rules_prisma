# rules_prisma
Bazel rules for Prisma.

Currently, there's a single rule: `prisma_js_library` which takes a prisma schema and outputs a typescript/javascript client.

## Installing

This library assumes the following (perhaps these will be addressed in a later release):
* You're using [rules_nodejs](https://github.com/bazelbuild/rules_nodejs), and it's added to your WORKSPACE in the typical fashion (at `@rules_nodejs`)
* You have your bazel npm packages at `@npm`
* `prisma-client-js` is your only generator (see `Additional Generators` below for ways to work with additional generators)
* The output directory of your `prisma-client-js` matches your `prisma_js_library` target name (see `using` below)

#### Required NPM deps

The following deps need to be installed into `@npm`:
```shell
npm install --save-dev prisma @prisma/client @prisma/engines
```

Add the following to your WORKSPACE after `rules_nodejs` and `@npm` have been initialized:

```python
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "rules_prisma",
    sha256 = '34f61a641ba35446e395505c2d4c3909ff95da13d49ce8c666efe6c3b2ab1f00',
    strip_prefix = "rules_prisma-0.1.1",
    url = "https://github.com/CooperBills/rules_prisma/archive/refs/tags/v0.1.1.tar.gz",
)
```

## Using

#### prisma_js_library

This target runs `prisma generate` on the given schema and can be targeted by typescript and javascript rules.

```python
load("@rules_prisma//prisma:prisma.bzl", "prisma_js_library")

prisma_js_library(
    # name of target must match output directory defined in prisma schema
    name = "myclient",
    schema = ":schema.prisma",
)

ts_project(
    name = "myserver_sources",
    ...
    deps = [
        ":myclient"
    ]
)

nodejs_binary(
    name = "myserver",
    data = [
        ... ,
        ":myclient",
    ],
    ...
)
```

```typescript
import { PrismaClient } from "./myclient";
import { copyFileSync } from "fs";
import { join } from "path";

// Prisma assumes the schema file lives in the current run dir, so we'll copy it in.
// If I find a cleaner way to do this, I'll update this readme.
copyFileSync(join(__dirname, "../myclient/schema.prisma"), "./schema.prisma");

const client = new PrismaClient();

...
```

## Additional Generators

If you use additional generators, you'll need to do one of the following:
* remove them (using a genrule), or:
* patch this library to include the necessary @npm//mygenerator deps to the prisma_wrapper, or:
* write your own nodejs_binary rule with `@rules_prisma//prisma/internal:prisma_wrapper.js` as the entry point and pass it to the `prisma_js_library` target using the `prisma_wrapper` attribute.

Note that the output of those generators won't be included in bazel's out. 
