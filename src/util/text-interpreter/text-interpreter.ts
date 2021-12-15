export interface TextInterpreterFcn {
    interpreteText(input: string): string;
}

export enum TextInterpreter {
    Markdown, Html, Custom
}
