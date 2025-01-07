import React from "react";
import { Input } from "antd";

const CustomizeInput: React.FC = ({ value = "", ...otherProps }) => {
  return (
    <div>
      <Input style={{ outline: "none" }} value={value} {...otherProps} />
    </div>
  );
};

export default CustomizeInput;
