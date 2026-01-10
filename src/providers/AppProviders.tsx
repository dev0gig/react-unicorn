import React, { ReactNode } from 'react';

// Context Providers
import { ContactsProvider } from '../../contexts/ContactsContext';

import { DashboardProvider } from '../../contexts/DashboardContext';
import { TemplatesProvider } from '../../contexts/TemplatesContext';
import { SignaturesProvider } from '../../contexts/SignaturesContext';
import { FavoritesProvider } from '../../contexts/FavoritesContext';
import { ScheduleProvider } from '../../contexts/ScheduleContext';

import { ModalProvider } from '../contexts/ModalContext';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <ContactsProvider>
            <DashboardProvider>
                <TemplatesProvider>
                    <SignaturesProvider>
                        <FavoritesProvider>
                            <ScheduleProvider>

                                <ModalProvider>
                                    {children}
                                </ModalProvider>

                            </ScheduleProvider>
                        </FavoritesProvider>
                    </SignaturesProvider>
                </TemplatesProvider>
            </DashboardProvider>
        </ContactsProvider>
    );
}
