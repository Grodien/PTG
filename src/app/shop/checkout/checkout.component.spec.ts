import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Item } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { CheckoutComponent } from './checkout.component';

/** Erzeugt einen minimalen Test-Artikel (die nicht genutzten Felder sind irrelevant). */
function makeItem(id: string, title: string, cost: number): Item {
  return {
    id,
    categoryId: 'cat',
    title,
    description: '',
    cost,
    createdAt: null as never,
  };
}

/**
 * Stub des {@link OrderService}, der je nach Konfiguration auflöst oder ablehnt.
 * Vermeidet jede Firestore-Abhängigkeit im Komponententest.
 */
class OrderServiceStub {
  shouldFail = false;
  lastDraft: unknown = null;
  callCount = 0;

  async create(draft: unknown): Promise<string> {
    this.callCount++;
    this.lastDraft = draft;
    if (this.shouldFail) {
      throw new Error('boom');
    }
    return 'order-123';
  }
}

describe('CheckoutComponent', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let component: CheckoutComponent;
  let cart: CartService;
  let orderStub: OrderServiceStub;

  beforeEach(async () => {
    orderStub = new OrderServiceStub();

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [{ provide: OrderService, useValue: orderStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();
  });

  it('erstellt die Komponente', () => {
    expect(component).toBeTruthy();
  });

  // Req 4.1 – Notizfeld wird gerendert.
  it('rendert das optionale Notizfeld', () => {
    const textarea: HTMLTextAreaElement | null =
      fixture.nativeElement.querySelector('#checkout-note');
    expect(textarea).not.toBeNull();
  });

  // Req 3.5 – Absenden deaktiviert bei leerem Warenkorb.
  it('deaktiviert das Absenden bei leerem Warenkorb', () => {
    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button');
    expect(button?.disabled).toBeTrue();
  });

  it('frühzeitiger Abbruch: submit() tut nichts bei leerem Warenkorb', async () => {
    await component.submit();
    expect(orderStub.callCount).toBe(0);
    expect(component.state()).toBe('idle');
  });

  // Req 4.2, 4.4, 4.5 – erfolgreicher Checkout.
  it('speichert die Bestellung, bestätigt und leert den Warenkorb bei Erfolg', async () => {
    cart.add(makeItem('a', 'Massage', 3));
    cart.add(makeItem('a', 'Massage', 3));
    component.note.set('  Ha di gärn  ');

    await component.submit();

    expect(orderStub.callCount).toBe(1);
    // Notiz wird getrimmt und durchgereicht.
    expect((orderStub.lastDraft as { note: string | null }).note).toBe('Ha di gärn');
    expect(component.state()).toBe('success');
    // Req 4.5 – Warenkorb ist geleert.
    expect(cart.itemCount()).toBe(0);
  });

  it('normalisiert eine leere Notiz zu null', async () => {
    cart.add(makeItem('a', 'Kuss', 1));
    component.note.set('   ');

    await component.submit();

    expect((orderStub.lastDraft as { note: string | null }).note).toBeNull();
  });

  // Req 4.6 – fehlgeschlagener Checkout lässt Warenkorb unverändert.
  it('zeigt einen Fehler und behält den Warenkorb bei Misserfolg', async () => {
    orderStub.shouldFail = true;
    cart.add(makeItem('a', 'Massage', 3));
    cart.add(makeItem('b', 'Film', 2));

    await component.submit();

    expect(component.state()).toBe('error');
    // Warenkorb bleibt vollständig erhalten (kein clear()).
    expect(cart.itemCount()).toBe(2);
    expect(cart.total()).toBe(5);
  });

  it('erlaubt nach einem Fehler einen erneuten Versuch', async () => {
    orderStub.shouldFail = true;
    cart.add(makeItem('a', 'Massage', 3));

    await component.submit();
    expect(component.state()).toBe('error');

    component.retry();
    expect(component.state()).toBe('idle');

    orderStub.shouldFail = false;
    await component.submit();
    expect(component.state()).toBe('success');
    expect(cart.itemCount()).toBe(0);
  });
});
