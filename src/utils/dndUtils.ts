import { Active, Over } from '@dnd-kit/core';
import { ToolLink, ToolGroup, Evidenzfall } from '../../types';

export const isLink = (active: Active | null): active is Active & { data: { current: { type: 'link'; link: ToolLink; group: ToolGroup } } } => {
    return active?.data?.current?.type === 'link';
};

export const isGroup = (active: Active | null): active is Active & { data: { current: { type: 'group'; group: ToolGroup } } } => {
    return active?.data?.current?.type === 'group';
};

export const isGroupContainer = (active: Over | null): boolean => {
    return active?.data?.current?.type === 'group-container' || active?.data?.current?.type === 'group';
};

export const isColumn = (active: Active | Over | null): boolean => {
    return active?.data?.current?.type === 'column';
};

export const isCase = (active: Active | null): active is Active & { data: { current: { type: 'case' } & Evidenzfall } } => {
    return active?.data?.current?.type === 'case';
};
