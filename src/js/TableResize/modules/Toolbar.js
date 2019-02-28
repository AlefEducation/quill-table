import IconAlignLeft from "quill/assets/icons/align-left.svg";
import IconAlignCenter from "quill/assets/icons/align-center.svg";
import IconAlignRight from "quill/assets/icons/align-right.svg";
import { BaseModule } from "./BaseModule";

import VQuill from "quill";
const Quill = window.Quill || VQuill;

const Parchment = Quill.imports.parchment;
const FloatStyle = new Parchment.Attributor.Style("float", "float");
const MarginStyle = new Parchment.Attributor.Style("margin", "margin");
const DisplayStyle = new Parchment.Attributor.Style("display", "display");
const WidthStyle = new Parchment.Attributor.Style("width", "width");
const OverflowStyle = new Parchment.Attributor.Style("overflow", "overflow");

export class Toolbar extends BaseModule {
    onCreate = () => {
        // Setup Toolbar
        this.toolbar = document.createElement("div");
        Object.assign(this.toolbar.style, this.options.toolbarStyles);
        this.overlay.appendChild(this.toolbar);
        // Setup Buttons
        this._defineAlignments();
        this._addToolbarButtons();
    };

    // The toolbar and its children will be destroyed when the overlay is removed
    onDestroy = () => {};

    // Nothing to update on drag because we are are positioned relative to the overlay
    onUpdate = () => {};

    _defineAlignments = () => {
        this.alignments = [
            {
                icon: IconAlignLeft,
                apply: () => {
                    DisplayStyle.add(this.table, "inline");
                    FloatStyle.add(this.table, "left");
                    MarginStyle.add(this.table, "0 1em 1em 0");
                    WidthStyle.add(this.table, "600px");
                    OverflowStyle.add(this.table, "hidden");
                },
                isApplied: () => FloatStyle.value(this.table) == "left"
            },
            {
                icon: IconAlignCenter,
                apply: () => {
                    DisplayStyle.add(this.table, "block");
                    FloatStyle.remove(this.table);
                    MarginStyle.add(this.table, "auto");
                    WidthStyle.add(this.table, "600px");
                    OverflowStyle.add(this.table, "hidden");
                },
                isApplied: () => MarginStyle.value(this.table) == "auto"
            },
            {
                icon: IconAlignRight,
                apply: () => {
                    DisplayStyle.add(this.table, "inline");
                    FloatStyle.add(this.table, "right");
                    MarginStyle.add(this.table, "0 0 1em 1em");
                    WidthStyle.add(this.table, "600px");
                    OverflowStyle.add(this.table, "hidden");
                },
                isApplied: () => FloatStyle.value(this.table) == "right"
            }
        ];
    };

    _addToolbarButtons = () => {
        const buttons = [];
        this.alignments.forEach((alignment, idx) => {
            const button = document.createElement("div");
            buttons.push(button);
            button.innerHTML = alignment.icon;
            button.addEventListener("click", () => {
                // deselect all buttons
                buttons.forEach(button => (button.style.filter = ""));
                if (alignment.isApplied()) {
                    // If applied, unapply
                    FloatStyle.remove(this.table);
                    MarginStyle.remove(this.table);
                    DisplayStyle.remove(this.table);
                    WidthStyle.remove(this.table);
                    OverflowStyle.remove(this.table);
                } else {
                    // otherwise, select button and apply
                    this._selectButton(button);
                    alignment.apply();
                }
                // image may change position; redraw drag handles
                this.requestUpdate();
            });
            Object.assign(button.style, this.options.toolbarButtonStyles);
            if (idx > 0) {
                button.style.borderLeftWidth = "0";
            }
            Object.assign(
                button.children[0].style,
                this.options.toolbarButtonSvgStyles
            );
            if (alignment.isApplied()) {
                // select button if previously applied
                this._selectButton(button);
            }
            this.toolbar.appendChild(button);
        });
    };

    _selectButton = button => {
        button.style.filter = "invert(20%)";
    };
}
