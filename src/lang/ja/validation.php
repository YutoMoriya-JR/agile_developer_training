<?php

return [
    'required' => ':attributeを入力してください。',
    'string' => ':attributeは文字列で入力してください。',
    'email' => 'メールアドレスの形式が正しくありません。',
    'confirmed' => ':attributeが確認用の入力と一致しません。',
    'unique' => 'この:attributeはすでに登録されています。',
    'exists' => '選択された:attributeは存在しません。',
    'date_format' => ':attributeは正しい日付（年-月-日）で入力してください。',
    'integer' => ':attributeの値が正しくありません。',
    'boolean' => ':attributeの値が正しくありません。',
    'in' => ':attributeの値が正しくありません。',
    'max' => ['string' => ':attributeは:max文字以内で入力してください。'],
    'min' => ['string' => ':attributeは:min文字以上で入力してください。'],
    'attributes' => [
        'name' => '氏名', 'email' => 'メールアドレス', 'password' => 'パスワード',
        'team' => '所属チーム', 'team_id' => 'チーム', 'user_id' => '投稿者',
        'date' => '対象日', 'report_date' => '対象日', 'work' => '作業内容・進捗',
        'concerns' => '困りごと・相談事項', 'next_plan' => '次の予定',
        'body' => 'コメント', 'q' => 'キーワード', 'action' => '操作',
        'view' => '表示範囲', 'concerns_only' => '困りごとの絞り込み',
    ],
];