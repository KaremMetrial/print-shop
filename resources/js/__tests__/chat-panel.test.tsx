import { ChatPanel } from '@/components/chat/chat-panel';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ok = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
const list = { data: [], meta: { locked: false, can_send: true, label: 'المصمم' } };

describe('ChatPanel', () => {
    beforeEach(() => {
        Object.defineProperty(globalThis.Element.prototype, 'scrollIntoView', { value: () => {}, configurable: true });
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('reuses the same client_id when a failed send is retried (no duplicate on server)', async () => {
        const sent: string[] = [];
        let fail = true;
        vi.stubGlobal('fetch', vi.fn((_u: string, init?: RequestInit) => {
            if (init?.method === 'POST') {
                sent.push(JSON.parse(init.body as string).client_id);
                if (fail) return Promise.reject(new Error('offline'));
                return ok({ data: { id: 1, duplicate: false } }, 201);
            }
            return ok(list);
        }));
        render(<ChatPanel url="/chat/items/1" mine={['staff']} />);
        const box = await screen.findByPlaceholderText('اكتب رسالتك…');
        fireEvent.change(box, { target: { value: 'مرحبا' } });
        await act(async () => fireEvent.click(screen.getByText('إرسال')));
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        fail = false;
        await act(async () => fireEvent.click(screen.getByText('إرسال')));
        await waitFor(() => expect(sent.length).toBe(2));
        expect(sent[0]).toBe(sent[1]);
    });

    it('shows the locked notice and hides the composer when chat is locked', async () => {
        vi.stubGlobal('fetch', vi.fn(() => ok({ data: [], meta: { locked: true, can_send: false, label: 'المصمم' } })));
        render(<ChatPanel url="/chat/items/1" mine={['staff']} />);
        expect(await screen.findByText(/المحادثة مغلقة/)).toBeTruthy();
        expect(screen.queryByPlaceholderText('اكتب رسالتك…')).toBeNull();
    });
});
