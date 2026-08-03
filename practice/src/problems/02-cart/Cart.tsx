import { useState } from 'react';

/**
 * 장바구니 주문 요약.
 *
 * - 상품별 수량 조절(+/−)
 * - 쿠폰 코드로 할인 적용
 * - 상품 삭제
 * - 소계·합계·최종 결제 금액 표시
 */

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

const INITIAL_ITEMS: CartItem[] = [
  { id: 'p1', name: '무선 키보드', price: 39000, qty: 1 },
  { id: 'p2', name: '버티컬 마우스', price: 27000, qty: 2 },
  { id: 'p3', name: 'USB-C 허브', price: 45000, qty: 1 },
  { id: 'p4', name: '노트북 스탠드', price: 32000, qty: 1 },
];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 한 줄(상품 하나)을 그린다. 선물 포장 여부는 이 줄이 스스로 기억한다. */
function CartRow({
  item,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [gift, setGift] = useState(false);

  return (
    <li className='row'>
      <div>
        <strong>{item.name}</strong>
        <span className='email'>
          {won(item.price)} × {item.qty} = {won(item.price * item.qty)}
        </span>
        <label className='email' style={{ cursor: 'pointer' }}>
          <input type='checkbox' checked={gift} onChange={(e) => setGift(e.target.checked)} /> 선물 포장
        </label>
      </div>
      <div className='actions'>
        <button disabled={item.qty <= 1} onClick={() => onQty(item.id, item.qty - 1)}>
          −
        </button>
        <span>{item.qty}</span>
        <button onClick={() => onQty(item.id, item.qty + 1)}>+</button>
        <button onClick={() => onRemove(item.id)}>삭제</button>
      </div>
    </li>
  );
}

export function Cart() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [coupon, setCoupon] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [couponInvalid, setCouponInvalid] = useState(false);

  // 상품 금액 합계(할인 전)
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const total = subtotal * (1 - discountRate);

  const handleQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)));
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const applyCoupon = () => {
    if (coupon === 'SAVE10') {
      setDiscountRate(0.1);
      setCouponInvalid(false);
    } else if (coupon === '') {
      setDiscountRate(0);
      setCouponInvalid(false);
    } else {
      setDiscountRate(0);
      setCouponInvalid(true);
    }
  };

  return (
    <div className='panel'>
      <ul className='list'>
        {items.map((item) => (
          <CartRow item={item} key={item.id} onQty={handleQty} onRemove={handleRemove} />
        ))}
      </ul>

      <form
        className='row'
        onSubmit={(e) => {
          e.preventDefault();
          applyCoupon();
        }}
      >
        <div className='row'>
          <input
            className='search'
            value={coupon}
            onChange={(e) => {
              setCoupon(e.target.value);
              setCouponInvalid(false);
            }}
            placeholder='쿠폰 코드 (SAVE10)'
          />
          <button>적용</button>
        </div>
        {couponInvalid && <p className='error'>유효하지 않은 쿠폰입니다.</p>}
      </form>
      <div style={{ marginTop: 12 }}>
        <p className='hint'>상품 금액: {won(subtotal)}</p>
        {discountRate > 0 && <p className='hint'>할인: {discountRate * 100}%</p>}
        <p>
          <strong>최종 결제 금액: {won(total)}</strong>
        </p>
      </div>
    </div>
  );
}
