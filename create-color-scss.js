"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var webpack_1 = __importDefault(require("webpack"));
var colors_1 = require("./src/config/colors");
var webpack_sources_1 = require("webpack-sources");
function hexToRgb(hex) {
    if (hex.startsWith('#')) {
        hex = hex.slice(1);
    }
    var aRgbHex = hex.match(/.{1,2}/g);
    return [parseInt(aRgbHex[0], 16), parseInt(aRgbHex[1], 16), parseInt(aRgbHex[2], 16)];
}
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function fillColorScale(data) {
    var _this = this;
    if (typeof data === 'string') {
        data = { '': data };
    }
    var hasMainRgb = '' in data;
    var isLevelMore100 = false;
    for (var level in data) {
        if (level && +level >= 100) {
            isLevelMore100 = true;
            break;
        }
    }
    if (!isLevelMore100 && (!hasMainRgb || Object.keys(data).length > 1)) {
        var startLevel_1 = 0, startRgb_1 = '0' in data
            ? hexToRgb(data[0])
            : [0, 0, 0], endLevel_1, endRgb_1;
        var newLevels_1 = [];
        var generateColor = function () {
            var levelDiff = endLevel_1 - startLevel_1;
            var rgbDiff = endRgb_1.map(function (color, i) { return (color - startRgb_1[i]) / levelDiff; });
            var _loop_1 = function (eachNewLevel) {
                var currentLevelDiff = eachNewLevel - startLevel_1;
                var newRgb = startRgb_1.map(function (color, i) { return Math.round(color + rgbDiff[i] * currentLevelDiff); });
                data[eachNewLevel] = '#' + rgbToHex.call.apply(rgbToHex, __spreadArray([_this], newRgb, false));
            };
            for (var _i = 0, newLevels_2 = newLevels_1; _i < newLevels_2.length; _i++) {
                var eachNewLevel = newLevels_2[_i];
                _loop_1(eachNewLevel);
            }
        };
        for (var i = 1; i < 100; i++) {
            if (i in data) {
                if (newLevels_1.length) {
                    endLevel_1 = i;
                    endRgb_1 = hexToRgb(data[i]);
                    generateColor();
                    newLevels_1.length = 0;
                    startRgb_1 = endRgb_1;
                }
                else {
                    startRgb_1 = hexToRgb(data[i]);
                }
                startLevel_1 = i;
            }
            else {
                newLevels_1.push(i);
            }
        }
        if (newLevels_1.length) {
            endLevel_1 = 100;
            endRgb_1 = '100' in data
                ? hexToRgb(data[100])
                : [255, 255, 255];
            generateColor();
        }
    }
    if (!hasMainRgb) {
        data[''] = data[isLevelMore100 ? '500' : '50'];
    }
    return data;
}
module.exports = /** @class */ (function () {
    function CreateColorScssPlugin() {
    }
    CreateColorScssPlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks.thisCompilation.tap(CreateColorScssPlugin.name, function (compilation) {
            compilation.hooks.processAssets.tap({
                name: CreateColorScssPlugin.name,
                stage: webpack_1["default"].Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, function () { return __awaiter(_this, void 0, void 0, function () {
                var data, colorName, levelColors, level, name_1;
                return __generator(this, function (_a) {
                    console.log();
                    data = '';
                    for (colorName in colors_1.defaultColors) {
                        levelColors = fillColorScale(colors_1.defaultColors[colorName]);
                        for (level in levelColors) {
                            name_1 = colorName;
                            if (level !== '') {
                                name_1 += '-' + level;
                            }
                            data += '$' + name_1 + ':' + levelColors[level] + ';';
                        }
                    }
                    compilation.emitAsset('color.scss', new webpack_sources_1.RawSource(data));
                    return [2 /*return*/];
                });
            }); });
        });
    };
    return CreateColorScssPlugin;
}());
