const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
        popup: path.join(srcDir, "popup", "popup.tsx"),
        options: path.join(srcDir, "options.tsx"),
        content_script: path.join(srcDir, "content_script", "index.tsx"),
        background: path.join(srcDir, "background.ts"),
    },
    output: {
        path: path.join(__dirname, "../dist"),
        filename: "js/[name].js",
    },
    optimization: {
        // Disable code splitting
        splitChunks: false,
        // Preserve modules
        moduleIds: "named",
        chunkIds: "named",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: ".", to: "./", context: "public" },
                { from: "./src/bmc.js", to: "js/bmc.js" }
            ],
            options: {},
        }),
    ],
};
