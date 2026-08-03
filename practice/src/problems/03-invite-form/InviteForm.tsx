import { useState, type ChangeEvent } from 'react';
import { sendInvite, type Role } from '../../mock/api';

type FormState = {
  name: string;
  email: string;
  role: Role;
  useCompanyDomain: boolean;
  companyDomain: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  role: 'member',
  useCompanyDomain: false,
  companyDomain: '',
};

/**
 * 팀원 초대 폼.
 *
 * - 이름 / 이메일 / 역할을 입력해서 초대를 보낸다
 * - "회사 이메일로 초대"를 켜면 회사 도메인이 필수가 된다
 * - 제출하면 서버에 초대 요청을 보내고(800ms) 결과를 보여준다
 */
export function InviteForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** 입력이 바뀌면 해당 필드만 갈아끼운다. */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (e.target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked, companyDomain: '' }));
      setErrors((prev) => {
        const { companyDomain, ...rest } = prev;
        return rest;
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /** 필수값을 검사하고, 문제가 있으면 필드별 안내를 채운다. */
  const validate = () => {
    const nextErrors: { [key: string]: string } = {};
    if (!form.name.trim()) {
      nextErrors.name = '이름을 입력해주세요.';
    }
    if (!form.email.trim()) {
      nextErrors.email = '이메일을 입력해주세요.';
    }
    if (form.useCompanyDomain && !form.companyDomain.trim()) {
      nextErrors.companyDomain = '회사 도메인을 입력해주세요.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(false);
    if (!validate()) return;

    setSubmitError('');
    setSubmitting(true);

    try {
      await sendInvite({
        name: form.name,
        email: form.email,
        role: form.role,
        companyDomain: form.companyDomain,
      });

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '초대를 보내지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='panel'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className='field'>
          <label htmlFor='name'>이름</label>
          <input
            id='name'
            name='name'
            className='search'
            value={form.name}
            onChange={handleChange}
            placeholder='예: 김민수'
          />
          {errors.name && <p className='error'>{errors.name}</p>}
        </div>

        <div className='field'>
          <label htmlFor='email'>이메일</label>
          <input
            id='email'
            name='email'
            className='search'
            value={form.email}
            onChange={handleChange}
            placeholder='예: newbie@example.com'
          />
          {errors.email && <p className='error'>{errors.email}</p>}
        </div>

        <div className='field'>
          <label htmlFor='role'>역할</label>
          <select id='role' name='role' className='search' value={form.role} onChange={handleChange}>
            <option value='member'>member</option>
            <option value='admin'>admin</option>
          </select>
        </div>

        <div className='field'>
          <label className='checkline'>
            <input type='checkbox' name='useCompanyDomain' checked={form.useCompanyDomain} onChange={handleChange} />
            회사 이메일로 초대
          </label>
        </div>

        {form.useCompanyDomain && (
          <div className='field'>
            <label htmlFor='companyDomain'>회사 도메인</label>
            <input
              id='companyDomain'
              name='companyDomain'
              className='search'
              value={form.companyDomain}
              onChange={handleChange}
              placeholder='예: mz.co.kr'
            />
            {errors.companyDomain && <p className='error'>{errors.companyDomain}</p>}
          </div>
        )}

        <button className='more' type='submit' disabled={submitting}>
          초대 보내기
        </button>
      </form>
      {submitting && <p className='hint'>초대 보내는 중…</p>}
      {submitted && <p className='ok'>초대를 보냈습니다.</p>}
      {submitError && <p className='error'>{submitError}</p>}
    </div>
  );
}
