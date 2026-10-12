#!/usr/bin/env node
"use strict";

/**
 * build-menu.js
 * Generates the Wallpaper Engine settings menu (project.json → general.properties)
 * from tools/menu.config.js, the single source of truth for the menu.
 *
 * Usage:
 *   node tools/build-menu.js            → validate, write project.json, regenerate CATEGORY_ORDER_REFERENCE.md
 *   node tools/build-menu.js --dry-run  → validate only
 *   node tools/build-menu.js --import   → (re)create menu.config.js from the current project.json
 *
 * Wallpaper Engine shows the menu as one flat list sorted by `order`; a setting appears under the
 * group header placed before it. This script assigns `order`, `index` and `group` from the position
 * in menu.config.js, so moving a setting means moving its entry in the config.
 *
 * Never rename or remove a key: Wallpaper Engine stores saved values by key. The build fails if a key
 * from the current project.json is missing, unless it is listed in `removedKeys` in the config.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PROJECT_PATH = path.join(ROOT, "project.json");
const CONFIG_PATH = path.join(__dirname, "menu.config.js");
const DOCS_PATH = path.join(ROOT, "CATEGORY_ORDER_REFERENCE.md");
const { COLOR_SETTINGS } = require(path.join(ROOT, "js", "color-map.js"));

const FIRST_ORDER = 100;
const ITEM_FIELD_ORDER = ["key", "type", "text", "value", "condition", "options", "fraction", "min", "max", "step", "precision"];
const PROPERTY_FIELD_ORDER = ["index", "order", "group", "type", "text", "value", "condition", "options", "fraction", "min", "max", "step", "precision"];

function orderFields(obj, fieldOrder) {
	const result = {};
	for (const key of fieldOrder) if (key in obj) result[key] = obj[key];
	for (const key of Object.keys(obj)) if (!(key in result)) result[key] = obj[key];
	return result;
}

function readProject() {
	return JSON.parse(fs.readFileSync(PROJECT_PATH, "utf8"));
}

function serializeConfig(groups, removedKeys = []) {
	const indent = (text, tabs) => text.split("\n").map((line) => "\t".repeat(tabs) + line).join("\n");
	const groupBlocks = groups.map((group) => {
		const items = group.items.map((item) => indent(JSON.stringify(orderFields(item, ITEM_FIELD_ORDER), null, "\t"), 4)).join(",\n");
		return `\t\t{\n\t\t\tkey: ${JSON.stringify(group.key)},\n\t\t\ttext: ${JSON.stringify(group.text)},\n\t\t\titems: [\n${items},\n\t\t\t],\n\t\t}`;
	});
	return [
		"// Settings menu for Wallpaper Engine: the source of truth for general.properties in project.json.",
		"// Edit this file, then run: node tools/build-menu.js",
		"// order, index and group are generated from the position here, so just put items where they should appear.",
		"// Never rename or remove a key (Wallpaper Engine stores saved values by key); if a key really must go,",
		"// add it to removedKeys so the build knows it was intentional.",
		"",
		"module.exports = {",
		`\tremovedKeys: ${JSON.stringify(removedKeys)},`,
		"\tgroups: [",
		groupBlocks.join(",\n") + ",",
		"\t],",
		"};",
		"",
	].join("\n");
}

function importFromProject() {
	const properties = readProject().general.properties;
	const entries = Object.entries(properties).sort((a, b) => a[1].order - b[1].order);
	const groups = [];
	for (const [key, prop] of entries) {
		const { index, order, group, ...rest } = prop;
		if (prop.type === "group") {
			groups.push({ key, text: prop.text, items: [] });
			continue;
		}
		const target = groups.find((g) => g.key === group) || groups[groups.length - 1];
		target.items.push({ key, ...rest });
	}
	fs.writeFileSync(CONFIG_PATH, serializeConfig(groups), "utf8");
	console.log(`✓ wrote ${path.relative(ROOT, CONFIG_PATH)} (${groups.length} groups, ${entries.length - groups.length} settings)`);
}

function buildProperties(config) {
	const properties = {};
	let order = FIRST_ORDER;
	let index = 0;
	for (const group of config.groups) {
		properties[group.key] = { index: index++, order: order++, type: "group", text: group.text, value: "" };
		for (const item of group.items) {
			const { key, ...prop } = item;
			properties[key] = orderFields({ index: index++, order: order++, group: group.key, ...prop }, PROPERTY_FIELD_ORDER);
		}
	}
	return properties;
}

function validate(config, properties, currentProperties) {
	const errors = [];
	const seen = new Set();
	for (const group of config.groups) {
		for (const key of [group.key, ...group.items.map((item) => item.key)]) {
			if (!key) errors.push(`item without key in group "${group.key}"`);
			else if (seen.has(key)) errors.push(`duplicate key "${key}"`);
			seen.add(key);
		}
	}

	for (const [key, prop] of Object.entries(properties)) {
		for (const [, ref] of String(prop.condition || "").matchAll(/([A-Za-z_][\w-]*)\.value/g)) {
			if (!(ref in properties)) errors.push(`"${key}" condition refers to unknown key "${ref}"`);
		}
		if (prop.type === "color" && !(key in COLOR_SETTINGS)) errors.push(`color "${key}" is missing from js/color-map.js`);
	}
	for (const key of Object.keys(COLOR_SETTINGS)) {
		if (!(key in properties)) errors.push(`js/color-map.js color "${key}" is not in the menu`);
	}

	const removed = new Set(config.removedKeys || []);
	for (const key of Object.keys(currentProperties)) {
		if (!(key in properties) && !removed.has(key)) {
			errors.push(`key "${key}" from project.json is missing (saved values would be lost; add it to removedKeys if intended)`);
		}
	}
	return errors;
}

function buildDocs(config) {
	const lines = [
		"# Settings Menu Reference",
		"",
		"> Auto-generated by `tools/build-menu.js` from `tools/menu.config.js`. Do not edit by hand.",
		"",
		"To change the menu: edit `tools/menu.config.js`, run `node tools/build-menu.js`, then reload the wallpaper.",
		"If the Wallpaper Engine editor reorders `project.json`, just run the build again.",
		"",
	];
	for (const group of config.groups) {
		lines.push(`## ${group.text} (\`${group.key}\`)`, "");
		for (const item of group.items) {
			const text = String(item.text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
			lines.push(`- \`${item.key}\` (${item.type}) ${text}`);
		}
		lines.push("");
	}
	return lines.join("\n");
}

function main() {
	if (process.argv.includes("--import")) return importFromProject();

	delete require.cache[CONFIG_PATH];
	const config = require(CONFIG_PATH);
	const project = readProject();
	const properties = buildProperties(config);
	const errors = validate(config, properties, project.general.properties);

	if (errors.length > 0) {
		console.error(`✗ ${errors.length} problem(s):`);
		for (const error of errors) console.error(`  - ${error}`);
		process.exit(1);
	}

	const settingCount = Object.keys(properties).length - config.groups.length;
	if (process.argv.includes("--dry-run")) {
		console.log(`✓ valid: ${config.groups.length} groups, ${settingCount} settings (nothing written)`);
		return;
	}

	project.general.properties = properties;
	fs.writeFileSync(PROJECT_PATH, JSON.stringify(project, null, 2) + "\n", "utf8");
	fs.writeFileSync(DOCS_PATH, buildDocs(config), "utf8");
	console.log(`✓ project.json: ${config.groups.length} groups, ${settingCount} settings`);
	console.log(`✓ ${path.basename(DOCS_PATH)} regenerated`);
}

if (require.main === module) main();
module.exports = { serializeConfig };
