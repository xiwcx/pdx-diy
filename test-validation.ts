// Test file with intentional formatting and type issues
export function testFunction(name: string, age: number) {
	const greeting = `Hello ${name}`;
	const result: string = `${greeting} you are ${age} years old`;
	console.log(result);
	return result;
}

// Missing semicolon and bad formatting
export const badlyFormatted = {
	name: "test",
	value: 123,
	items: ["a", "b", "c"],
};

// Fixed type error
export function typeError(): number {
	return 42;
}
