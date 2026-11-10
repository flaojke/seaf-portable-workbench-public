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

import Column from "./Column";

import type { Meta, StoryObj } from "@storybook/react";

import TablesInfoProvider from "@/providers/TablesInfoProvider";
import { exampleData } from "@/fake/fakeJsonTables";

const meta: Meta<typeof Column> = {
  component: Column,
  title: "components/Column",
};

export default meta;

type Story = StoryObj<typeof Column>;

export const ColumnStory: Story = {
  args: {
    colName: "username",
    type: "varchar",
  },
  parameters: {
    withKonvaWrapper: true,
  },
  render: (props) => (
    <TablesInfoProvider tables={exampleData.tables}>
      <Column {...props} />
    </TablesInfoProvider>
  ),
};
