/*
  Copyright (C) 2023 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2025
*/

import { Text } from "react-konva";

import DiagramWrapper from "./DiagramWrapper";

import type { Meta, StoryObj } from "@storybook/react";

import TablesPositionsProvider from "@/providers/TablesPositionsProvider";

const meta: Meta<typeof DiagramWrapper> = {
  component: DiagramWrapper,
  title: "components/DiagramWrapper",
};

export default meta;

type Story = StoryObj<typeof DiagramWrapper>;

export const DiagramWrapperWrapper: Story = {
  render: (props) => <DiagramWrapper {...props} />,
  args: {
    children: (
      <Text text="Incididunt ad veniam do est nisi eu incididunt eiusmod nulla veniam cillum reprehenderit cupidatat." />
    ),
  },
  decorators: [
    (Story) => (
      <TablesPositionsProvider tables={[]} refs={[]}>
        <Story />
      </TablesPositionsProvider>
    ),
  ],
};
