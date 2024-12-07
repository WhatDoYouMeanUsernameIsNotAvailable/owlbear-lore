// Wait for OBR to be ready
const ID = 'com.prop.lore';

OBR.onReady(async () => {
    // Set theme
    const theme = await OBR.theme.getTheme();
    document.documentElement.classList.add(theme);
    OBR.theme.onChange((theme) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    });

    const ready = await OBR.scene.isReady();
    if (!ready) return;

    // Initialize the extension
    async function initializeExtension() {
        // Register the context menu items
        await OBR.contextMenu.create({
            id: `${ID}/context-menu`,
            icons: [
                {
                    icon: "/icon.svg",
                    label: "Add Lore",
                    filter: {
                        every: [{ key: "type", value: "IMAGE" }],
                    },
                },
            ],
            onClick(context) {
                handleLoreClick(context);
            },
        });

        // Listen for metadata changes to update the context menu label
        OBR.scene.items.onChange(async (items) => {
            const contextMenuItems = await OBR.contextMenu.getItems();
            const lorePropIds = items
                .filter((item) => item.metadata?.[`${ID}/lore`])
                .map((item) => item.id);

            // Update context menu items based on whether items have lore
            await Promise.all(
                contextMenuItems.map(async (menuItem) => {
                    if (menuItem.id === `${ID}/context-menu`) {
                        const hasLore = menuItem.context.items.some((item) =>
                            lorePropIds.includes(item.id)
                        );
                        await OBR.contextMenu.update(menuItem.id, {
                            icons: [
                                {
                                    icon: "/icon.svg",
                                    label: hasLore ? "Edit Lore" : "Add Lore",
                                    filter: {
                                        every: [{ key: "type", value: "IMAGE" }],
                                    },
                                },
                            ],
                        });
                    }
                })
            );
        });
    }

    // Handle clicking the lore menu item
    async function handleLoreClick(context) {
        const items = context.items;
        if (items.length !== 1) return;

        const item = items[0];
        const currentLore = item.metadata?.[`${ID}/lore`] || "";

        // Create popup for lore input
        const popup = document.createElement("div");
        popup.innerHTML = `
            <h3>Enter Lore Text</h3>
            <textarea
                id="loreText"
                style="width: 100%; height: 200px; margin: 10px 0; background: #3c3c3c; color: white; border: 1px solid #666;"
            >${currentLore}</textarea>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn" style="padding: 8px 16px; background: #666;">Cancel</button>
                <button id="saveBtn" style="padding: 8px 16px; background: #4a9eff;">Save</button>
            </div>
        `;

        document.getElementById("app").appendChild(popup);

        // Handle save button click
        document.getElementById("saveBtn").onclick = async () => {
            const loreText = document.getElementById("loreText").value;
            await OBR.scene.items.updateItems([item], (items) => {
                const metadata = { ...items[0].metadata };
                metadata[`${ID}/lore`] = loreText;
                items[0].metadata = metadata;
            });
            popup.remove();
        };

        // Handle cancel button click
        document.getElementById("cancelBtn").onclick = () => {
            popup.remove();
        };
    }

    // Start the extension
    initializeExtension();
});
