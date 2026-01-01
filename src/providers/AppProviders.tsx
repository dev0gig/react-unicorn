import React, { ReactNode } from 'react';

// Context Providers
import { ContactsProvider } from '../../contexts/ContactsContext';
import { EvidenzProvider } from '../../contexts/EvidenzContext';
import { DashboardProvider } from '../../contexts/DashboardContext';
import { TemplatesProvider } from '../../contexts/TemplatesContext';
import { SignaturesProvider } from '../../contexts/SignaturesContext';
import { FavoritesProvider } from '../../contexts/FavoritesContext';
import { ScheduleProvider } from '../../contexts/ScheduleContext';
import { NotesProvider } from '../../contexts/NotesContext';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <ContactsProvider>
            <EvidenzProvider>
                <DashboardProvider>
                    <TemplatesProvider>
                        <SignaturesProvider>
                            <FavoritesProvider>
                                <ScheduleProvider>
                                    <NotesProvider>
                                        {children}
                                    </NotesProvider>
                                </ScheduleProvider>
                            </FavoritesProvider>
                        </SignaturesProvider>
                    </TemplatesProvider>
                </DashboardProvider>
            </EvidenzProvider>
        </ContactsProvider>
    );
}
