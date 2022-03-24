import { PrismaClient } from "../prisma/myclient";
import { copyFileSync } from "fs";
import {join} from "path";

copyFileSync(join(__dirname, "../prisma/myclient/schema.prisma"), "./schema.prisma");

const client = new PrismaClient();

console.log("Example server started!")
console.log(client)
