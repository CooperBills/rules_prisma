const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const prisma = require.resolve("prisma");

const enginesPackage = "@prisma/engines";
const enginesIndex = require.resolve(enginesPackage);
const enginesDir = enginesIndex.slice(
  0,
  enginesIndex.indexOf(enginesPackage) + enginesPackage.length
);

const args = process.argv.slice(2);
/*
args[0]: schema location
args[1]: prisma output dir
args[2]: bazel expected output directory
args[3..n]: args for prisma
 */

const schemaFolder = path.dirname(args[0]);
const expectedPrismaClientFolder = schemaFolder + "/" + args[1];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  const enginesReadDir = fs.readdirSync(enginesDir);
  const env = {
    ...process.env,
    // PRISMA_QUERY_ENGINE_BINARY: enginesReadDir.filter(fname => fname.startsWith("..."))
    PRISMA_MIGRATION_ENGINE_BINARY: path.join(enginesDir, enginesReadDir.filter((fname) =>
      fname.startsWith("migration-engine")
    )[0]),
    PRISMA_INTROSPECTION_ENGINE_BINARY: path.join(enginesDir, enginesReadDir.filter((fname) =>
      fname.startsWith("introspection-engine")
    )[0]),
    PRISMA_FMT_BINARY: path.join(enginesDir, enginesReadDir.filter((fname) =>
      fname.startsWith("prisma-fmt")
    )[0]),
    PRISMA_QUERY_ENGINE_LIBRARY: path.join(enginesDir, enginesReadDir.filter((fname) =>
      fname.startsWith("libquery_engine") || fname.startsWith("query_engine")
    )[0]),
  };

  childProcess.execSync(`node ${prisma} ${args.slice(3).join(" ")}`, {
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });

  try {
    fs.accessSync(expectedPrismaClientFolder, fs.constants.R_OK);
  } catch (e) {
    console.error(e);
    console.error(
      `Could not access the folder ${expectedPrismaClientFolder} - this is the expected output folder for prisma client generation. Please be sure your prisma schema is configured to output here.`
    );
    process.exit(1);
  }

  // fs.copyFileSync(expectedPrismaClientFolder, args[2])
  copyRecursiveSync(expectedPrismaClientFolder, args[2]);
  // childProcess.execSync(`cp -r ${expectedPrismaClientFolder}/* ${args[2]}`);
} catch (e) {
  console.error(e);
  process.exit(1);
}
