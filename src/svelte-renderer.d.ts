declare module 'svelte/renderer' {
	export function createRenderer<T extends Record<string, any>>(
		renderer: T
	): T & {
		render: (
			component: any,
			options: { target: any; props?: Record<string, any>; context?: Map<any, any> }
		) => { component: any; unmount: () => void };
	};
}
