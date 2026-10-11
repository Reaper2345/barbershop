<?php

/*
|--------------------------------------------------------------------------
| Russian validation messages
|--------------------------------------------------------------------------
|
| Applied automatically because APP_LOCALE=ru. Keys not listed here fall back
| to resources/lang/en (or the framework defaults), so partial coverage is safe.
|
*/

return [

    'accepted' => 'Поле «:attribute» должно быть принято.',
    'accepted_if' => 'Поле «:attribute» должно быть принято, когда :other равно :value.',
    'active_url' => 'Поле «:attribute» содержит недействительный URL.',
    'after' => 'В поле «:attribute» должна быть дата после :date.',
    'after_or_equal' => 'В поле «:attribute» должна быть дата после или равная :date.',
    'alpha' => 'Поле «:attribute» может содержать только буквы.',
    'alpha_dash' => 'Поле «:attribute» может содержать только буквы, цифры, дефис и подчёркивание.',
    'alpha_num' => 'Поле «:attribute» может содержать только буквы и цифры.',
    'array' => 'Поле «:attribute» должно быть массивом.',
    'ascii' => 'Поле «:attribute» может содержать только однобайтовые буквенно-цифровые символы.',
    'before' => 'В поле «:attribute» должна быть дата до :date.',
    'before_or_equal' => 'В поле «:attribute» должна быть дата до или равная :date.',
    'between' => [
        'array' => 'Поле «:attribute» должно содержать от :min до :max элементов.',
        'file' => 'Размер файла в поле «:attribute» должен быть от :min до :max килобайт.',
        'numeric' => 'Поле «:attribute» должно быть между :min и :max.',
        'string' => 'Поле «:attribute» должно содержать от :min до :max символов.',
    ],
    'boolean' => 'Поле «:attribute» должно быть истиной или ложью.',
    'can' => 'Поле «:attribute» содержит недопустимое значение.',
    'confirmed' => 'Поле «:attribute» не совпадает с подтверждением.',
    'current_password' => 'Неверный пароль.',
    'date' => 'Поле «:attribute» должно быть корректной датой.',
    'date_equals' => 'Поле «:attribute» должно быть датой, равной :date.',
    'date_format' => 'Поле «:attribute» должно соответствовать формату :format.',
    'decimal' => 'Поле «:attribute» должно содержать :decimal знаков после запятой.',
    'declined' => 'Поле «:attribute» должно быть отклонено.',
    'declined_if' => 'Поле «:attribute» должно быть отклонено, когда :other равно :value.',
    'different' => 'Поля «:attribute» и :other должны различаться.',
    'digits' => 'Поле «:attribute» должно содержать :digits цифр.',
    'digits_between' => 'Поле «:attribute» должно содержать от :min до :max цифр.',
    'dimensions' => 'Изображение в поле «:attribute» имеет недопустимые размеры.',
    'distinct' => 'Поле «:attribute» содержит повторяющееся значение.',
    'doesnt_end_with' => 'Поле «:attribute» не должно заканчиваться на одно из следующих значений: :values.',
    'doesnt_start_with' => 'Поле «:attribute» не должно начинаться с одного из следующих значений: :values.',
    'email' => 'Поле «:attribute» должно быть корректным адресом электронной почты.',
    'ends_with' => 'Поле «:attribute» должно заканчиваться на одно из следующих значений: :values.',
    'enum' => 'Выбранное значение для «:attribute» недопустимо.',
    'exists' => 'Выбранное значение для «:attribute» недопустимо.',
    'file' => 'Поле «:attribute» должно быть файлом.',
    'filled' => 'Поле «:attribute» обязательно для заполнения.',
    'gt' => [
        'array' => 'Поле «:attribute» должно содержать больше :value элементов.',
        'file' => 'Размер файла в поле «:attribute» должен быть больше :value килобайт.',
        'numeric' => 'Поле «:attribute» должно быть больше :value.',
        'string' => 'Поле «:attribute» должно содержать больше :value символов.',
    ],
    'gte' => [
        'array' => 'Поле «:attribute» должно содержать :value элементов или больше.',
        'file' => 'Размер файла в поле «:attribute» должен быть не менее :value килобайт.',
        'numeric' => 'Поле «:attribute» должно быть больше или равно :value.',
        'string' => 'Поле «:attribute» должно содержать :value символов или больше.',
    ],
    'image' => 'Поле «:attribute» должно быть изображением.',
    'in' => 'Выбранное значение для «:attribute» недопустимо.',
    'in_array' => 'Поле «:attribute» не существует в :other.',
    'integer' => 'Поле «:attribute» должно быть целым числом.',
    'ip' => 'Поле «:attribute» должно быть корректным IP-адресом.',
    'ipv4' => 'Поле «:attribute» должно быть корректным IPv4-адресом.',
    'ipv6' => 'Поле «:attribute» должно быть корректным IPv6-адресом.',
    'json' => 'Поле «:attribute» должно быть корректной JSON-строкой.',
    'lowercase' => 'Поле «:attribute» должно быть в нижнем регистре.',
    'lt' => [
        'array' => 'Поле «:attribute» должно содержать меньше :value элементов.',
        'file' => 'Размер файла в поле «:attribute» должен быть меньше :value килобайт.',
        'numeric' => 'Поле «:attribute» должно быть меньше :value.',
        'string' => 'Поле «:attribute» должно содержать меньше :value символов.',
    ],
    'lte' => [
        'array' => 'Поле «:attribute» должно содержать не больше :value элементов.',
        'file' => 'Размер файла в поле «:attribute» не должен превышать :value килобайт.',
        'numeric' => 'Поле «:attribute» должно быть меньше или равно :value.',
        'string' => 'Поле «:attribute» должно содержать не больше :value символов.',
    ],
    'mac_address' => 'Поле «:attribute» должно быть корректным MAC-адресом.',
    'max' => [
        'array' => 'Поле «:attribute» не должно содержать больше :max элементов.',
        'file' => 'Размер файла в поле «:attribute» не должен превышать :max килобайт.',
        'numeric' => 'Поле «:attribute» не должно превышать :max.',
        'string' => 'Поле «:attribute» не должно превышать :max символов.',
    ],
    'max_digits' => 'Поле «:attribute» не должно содержать больше :max цифр.',
    'mimes' => 'Поле «:attribute» должно быть файлом одного из типов: :values.',
    'mimetypes' => 'Поле «:attribute» должно быть файлом одного из типов: :values.',
    'min' => [
        'array' => 'Поле «:attribute» должно содержать не менее :min элементов.',
        'file' => 'Размер файла в поле «:attribute» должен быть не менее :min килобайт.',
        'numeric' => 'Поле «:attribute» должно быть не менее :min.',
        'string' => 'Поле «:attribute» должно содержать не менее :min символов.',
    ],
    'min_digits' => 'Поле «:attribute» должно содержать не менее :min цифр.',
    'missing' => 'Поле «:attribute» должно отсутствовать.',
    'missing_if' => 'Поле «:attribute» должно отсутствовать, когда :other равно :value.',
    'missing_unless' => 'Поле «:attribute» должно отсутствовать, если :other не равно :value.',
    'missing_with' => 'Поле «:attribute» должно отсутствовать, когда присутствует :values.',
    'missing_with_all' => 'Поле «:attribute» должно отсутствовать, когда присутствуют :values.',
    'multiple_of' => 'Поле «:attribute» должно быть кратно :value.',
    'not_in' => 'Выбранное значение для «:attribute» недопустимо.',
    'not_regex' => 'Формат поля «:attribute» недопустим.',
    'numeric' => 'Поле «:attribute» должно быть числом.',
    'password' => [
        'letters' => 'Поле «:attribute» должно содержать хотя бы одну букву.',
        'mixed' => 'Поле «:attribute» должно содержать хотя бы одну заглавную и одну строчную букву.',
        'numbers' => 'Поле «:attribute» должно содержать хотя бы одну цифру.',
        'symbols' => 'Поле «:attribute» должно содержать хотя бы один символ.',
        'uncompromised' => 'Указанный «:attribute» найден в утечке данных. Пожалуйста, выберите другое значение.',
    ],
    'present' => 'Поле «:attribute» должно присутствовать.',
    'present_if' => 'Поле «:attribute» должно присутствовать, когда :other равно :value.',
    'present_unless' => 'Поле «:attribute» должно присутствовать, если :other не равно :value.',
    'present_with' => 'Поле «:attribute» должно присутствовать, когда присутствует :values.',
    'present_with_all' => 'Поле «:attribute» должно присутствовать, когда присутствуют :values.',
    'prohibited' => 'Поле «:attribute» запрещено.',
    'prohibited_if' => 'Поле «:attribute» запрещено, когда :other равно :value.',
    'prohibited_unless' => 'Поле «:attribute» запрещено, если :other не находится в :values.',
    'prohibits' => 'Поле «:attribute» запрещает присутствие :other.',
    'regex' => 'Формат поля «:attribute» недопустим.',
    'required' => 'Поле «:attribute» обязательно для заполнения.',
    'required_array_keys' => 'Поле «:attribute» должно содержать записи для: :values.',
    'required_if' => 'Поле «:attribute» обязательно, когда :other равно :value.',
    'required_if_accepted' => 'Поле «:attribute» обязательно, когда :other принято.',
    'required_unless' => 'Поле «:attribute» обязательно, если :other не находится в :values.',
    'required_with' => 'Поле «:attribute» обязательно, когда присутствует :values.',
    'required_with_all' => 'Поле «:attribute» обязательно, когда присутствуют :values.',
    'required_without' => 'Поле «:attribute» обязательно, когда отсутствует :values.',
    'required_without_all' => 'Поле «:attribute» обязательно, когда отсутствуют все :values.',
    'same' => 'Поле «:attribute» должно совпадать с :other.',
    'size' => [
        'array' => 'Поле «:attribute» должно содержать :size элементов.',
        'file' => 'Размер файла в поле «:attribute» должен быть :size килобайт.',
        'numeric' => 'Поле «:attribute» должно быть равно :size.',
        'string' => 'Поле «:attribute» должно содержать :size символов.',
    ],
    'starts_with' => 'Поле «:attribute» должно начинаться с одного из следующих значений: :values.',
    'string' => 'Поле «:attribute» должно быть строкой.',
    'timezone' => 'Поле «:attribute» должно быть корректной временной зоной.',
    'ulid' => 'Поле «:attribute» должно быть корректным ULID.',
    'unique' => 'Такое значение поля «:attribute» уже используется.',
    'uploaded' => 'Не удалось загрузить файл из поля «:attribute».',
    'uppercase' => 'Поле «:attribute» должно быть в верхнем регистре.',
    'url' => 'Поле «:attribute» должно быть корректной ссылкой.',
    'uuid' => 'Поле «:attribute» должно быть корректным UUID.',

    /*
    |--------------------------------------------------------------------------
    | Custom messages
    |--------------------------------------------------------------------------
    */

    'custom' => [
        'starts_at' => [
            'after' => 'Нельзя записаться на прошедшее время. Выберите другой слот.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Attribute names
    |--------------------------------------------------------------------------
    |
    | The full map lives in attributes.php.
    |
    */

    'attributes' => [],

];
