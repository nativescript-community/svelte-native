<script>
    import { mount, unmount } from 'svelte';

    // children is the snippet passed by the parent (svelte 5 slot replacement)
    let { children, component = $bindable() } = $props();

    // Export a component factory for use by ListViewElement
    // Use $effect to update the factory when children changes
    $effect(() => {
        component = createFactory(children);
    });

    function createFactory(snippet) {
        if (!snippet) return null;

        // Returns a constructor-compatible factory
        // ListViewElement calls: new component({ target, props: { item } })
        return function ComponentFactory(options) {
            const { target, props = {} } = options;

            // Create an inner svelte 5 function-component that renders the snippet
            function SnippetWrapper(anchor, innerProps) {
                snippet?.(anchor, innerProps);
            }

            let currentTarget = target;
            let currentProps = { ...props };

            let activeInstance = mount(SnippetWrapper, {
                target: currentTarget,
                props: currentProps
            });

            return {
                // $set: update props by remounting (svelte 5 compatibility shim).
                // Note: full remounting is needed here because the snippet's props are not
                // reactive state that can be externally updated. For high-frequency updates,
                // prefer driving item data through NativeScript's ObservableArray reactivity.
                $set(newProps) {
                    Object.assign(currentProps, newProps);
                    unmount(activeInstance);
                    activeInstance = mount(SnippetWrapper, {
                        target: currentTarget,
                        props: currentProps
                    });
                },
                $destroy() {
                    unmount(activeInstance);
                }
            };
        };
    }
</script>
