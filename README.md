# rules_prisma
Bazel rules for Prisma.

## Installing

This library assumes the following:
* You're using [rules_nodejs](https://github.com/bazelbuild/rules_nodejs), and it's installed in the typical location (`@rules_nodejs`)
* You have your bazel npm packages at `@npm`

#### Required NPM deps

The following deps need to be installed into `@npm`:
```shell
npm install --save-dev prisma @prisma/client @prisma/engines
```

Add the following to your WORKSPACE after `rules_nodejs` and `@npm` have been initialized:

```python
http_archive(
    name = "rules_prisma",
    ...TODO
)
```

## Using

#### prisma_js_library

This target runs `prisma generate` on the given schema and can be targeted by typescript and javascript rules.

```python
load("@rules_prisma/prisma:prisma.bzl", "prisma_js_library")

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

const blah = new PrismaClient();
```

