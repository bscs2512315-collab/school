import * as React from "react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";

const AppTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    return <Textarea ref={ref} {...props} />;
  }
);
AppTextarea.displayName = "AppTextarea";

export default AppTextarea;
