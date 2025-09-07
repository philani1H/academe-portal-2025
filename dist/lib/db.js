"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = getConnection;
exports.executeQuery = executeQuery;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
// Helper function to get database connection
async function getConnection() {
    try {
        const db = await (0, sqlite_1.open)({
            filename: './APP-Database.db',
            driver: sqlite3_1.default.Database
        });
        return db;
    }
    catch (error) {
        console.error('Error getting database connection:', error);
        throw error;
    }
}
// Helper function to execute queries
async function executeQuery(query, params) {
    const db = await getConnection();
    try {
        const rows = await db.all(query, params);
        return rows;
    }
    catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
    finally {
        await db.close();
    }
}
