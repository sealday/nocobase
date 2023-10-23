import React, { useContext, useMemo } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { Grid, gridRowColWrap, useDesignable, useCurrentSchema, SchemaInitializer, FormV2 } from '@nocobase/client';
import { uid, merge } from '@formily/shared';
import { ChartFilterContext } from './FilterProvider';
import { css } from '@emotion/css';
import { createForm, onFieldChange, onFieldMount, onFieldUnmount } from '@formily/core';

const createFilterSchema = () => {
  return {
    type: 'void',
    'x-action': 'filter',
    'x-decorator': 'ChartFilterBlockProvider',
    'x-component': 'CardItem',
    'x-component-props': {
      size: 'small',
    },
    'x-designer': 'ChartFilterBlockDesigner',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'ChartFilterForm',
        'x-component-props': {
          layout: 'inline',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'ChartFilterGrid',
            'x-initializer': 'ChartFilterItemInitializers',
            properties: {},
          },
          actions: {
            type: 'void',
            'x-initializer': 'ChartFilterActionInitializers',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                float: 'right',
                marginTop: 8,
              },
            },
            properties: {},
          },
        },
      },
    },
  };
};

export const ChartFilterForm: React.FC = (props) => {
  const { addCustomField, removeCustomField } = useContext(ChartFilterContext);
  const form = useMemo(
    () =>
      createForm({
        effects() {
          const getCustomField = (field: any) => {
            const { name } = field.props || {};
            if (name.startsWith('custom.')) {
              return name.replace('custom.', '');
            }
            return null;
          };
          onFieldMount('*', (field: any) => {
            const name = getCustomField(field);
            if (!name) {
              return;
            }
            addCustomField(name, { title: field.title });
          });
          onFieldUnmount('*', (field: any) => {
            const name = getCustomField(field);
            if (!name) {
              return;
            }
            removeCustomField(name);
          });
          onFieldChange('*', ['title'], (field: any) => {
            const name = getCustomField(field);
            if (!name) {
              return;
            }
            addCustomField(name, { title: field.title });
          });
        },
      }),
    [addCustomField, removeCustomField],
  );
  return <FormV2 {...props} form={form} />;
};

export const ChartFilterGrid: React.FC = (props) => {
  const { collapse } = useContext(ChartFilterContext);
  return (
    <div
      className={css`
        .ant-nb-grid {
          overflow: hidden;
          height: ${collapse ? '44px' : 'auto'};
        }
      `}
    >
      <Grid {...props}>{props.children}</Grid>
    </div>
  );
};

export const FilterBlockInitializer: React.FC = (props: any) => {
  const { insertAdjacent } = useDesignable();
  const { setEnabled } = useContext(ChartFilterContext);
  const { item, remove: _remove, disabled } = props;
  const type = 'x-action';
  const schema = createFilterSchema();
  const { exists, remove } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    _remove || item.remove,
  );

  return (
    <SchemaInitializer.SwitchItem
      icon={<FilterOutlined />}
      checked={exists}
      disabled={disabled}
      title={item.title}
      onClick={() => {
        if (disabled) {
          return;
        }
        if (exists) {
          setEnabled(false);
          return remove();
        }
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insertAdjacent('afterBegin', gridRowColWrap(s));
        setEnabled(true);
      }}
    />
  );
};
