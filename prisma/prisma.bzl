load("@rules_nodejs//nodejs:providers.bzl", "declaration_info", "js_module_info")

def _prisma_js_library_impl(ctx):
    output_dir = ctx.attr.output_dir
    if (not output_dir):
        output_dir = ctx.label.name

    print(output_dir)

    out_dir = ctx.actions.declare_directory(output_dir)
    out_schema = ctx.actions.declare_file(output_dir + "/schema.prisma")
    out_ts_arr = [
        ctx.actions.declare_file(output_dir + "/index.d.ts"),
        ctx.actions.declare_file(output_dir + "/runtime/index.d.ts"),
        ctx.actions.declare_file(output_dir + "/runtime/index-browser.d.ts"),
        ctx.actions.declare_file(output_dir + "/runtime/proxy.d.ts"),
    ]
    out_js_arr = [
        ctx.actions.declare_file(output_dir + "/index.js"),
        ctx.actions.declare_file(output_dir + "/index-browser.js"),
        ctx.actions.declare_file(output_dir + "/runtime/index.js"),
        ctx.actions.declare_file(output_dir + "/runtime/index-browser.js"),
        ctx.actions.declare_file(output_dir + "/runtime/proxy.js"),
    ]

    inputs = depset(ctx.files.schema)

    args = ctx.actions.args()
    args.add(ctx.files.schema[0].path)
    args.add(output_dir)
    args.add(out_dir.path)
    args.add("generate")
    args.add("--schema=" + ctx.files.schema[0].path)

    ctx.actions.run(
        mnemonic = "CompilePrisma",
        outputs = [out_dir, out_schema] + out_js_arr + out_ts_arr,
        executable = ctx.executable.prisma_wrapper,
        arguments = [args],
        inputs = inputs,
        env = {
            "PRISMA_GENERATE_SKIP_AUTOINSTALL": "true",
            # "DEBUG": "*",
        },
    )
    return [
        DefaultInfo(files = depset([out_dir])),
        declaration_info(depset(out_ts_arr)),
        js_module_info(depset(out_js_arr + [out_schema])),
    ]

prisma_js_library = rule(
    implementation = _prisma_js_library_impl,
    attrs = {
        "schema": attr.label(
            doc = "input prisma schema file",
            allow_single_file = [".prisma"],
            mandatory = True,
        ),
        "output_dir": attr.string(
            doc = "[Optional] Output directory (must match the output defined in the schema generator block). Defaults to match the name of this rule.",
        ),
        "prisma_wrapper": attr.label(
            default = Label("//prisma/internal:prisma_wrapper"),
            executable = True,
            cfg = "exec",
        ),
    },
)
