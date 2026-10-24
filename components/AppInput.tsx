import React from "react";
import { Input } from "./ui/input";

export default function AppInput({ ...props }: React.ComponentProps<typeof Input>) {
    return <Input {...props} />;
}
