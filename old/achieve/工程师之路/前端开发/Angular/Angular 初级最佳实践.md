---
tags:
  - angular
  - web
---

# Project Structure

# Component

- 通用组件，可以被其他组件公用的，一般不包含状态，数据通过 Property 传入。
- 页面组件，包含页面相关的数据以及业务逻辑，会将数据传递给其他组件并订阅组件的事件。

通过命令 `ng generate component <路径>` 生成 Component，而每个 Component 都由 4 部分组成，模板，样式，测试，组件。

```bash
label-input
├── label-input.component.html    # Template
├── label-input.component.scss    # 样式
├── label-input.component.spec.ts # 测试
└── label-input.component.ts      # 组件逻辑代码
```

- 模板：用于 HTML 的渲染，定义 Component 如何展示。
- 样式：用于 HTML 渲染中使用到的 CSS 样式。
- 测试：用于 Component 的单元测试。
- 组件：定义 Property 以及事件，并准备渲染用的数据以及事件处理函数，并引用模板以及样式文件。

```ts
@Component({
  selector: 'app-label-input',
  imports: [],
  templateUrl: './label-input.component.html',
  styleUrl: './label-input.component.scss'
})
export class LabelInputComponent {
}
```

- selector：在其他模板中引用该组件的标签名。
- imports：该组件用到的其他组件或者功能包。
- templateUrl：组件对应的模板文件。
- styleUrl：模板文件用到的相关样式。

## 如何在其他组件中使用

在模板文件中使用组件的 selector 并在使用它的组件中导入该组件。

``` ts
@Component({
  selector: 'app-user-survey',
  // 导入要使用的组件
  imports: [LabelInputComponent],
  templateUrl: './user-survey.component.html',
  styleUrl: './user-survey.component.scss'
})
export class UserSurveyDetailsComponent {
}
```

``` html
<!-- user-survey-details.component.html -->
<div>
  <!-- 通过组件的 selector 来引用该组件 -->
  <app-label-input />
</div>
```
# Property Binding

组件的参数绑定有两种方式：
- ZoneJS，正在被 Angular 废弃
- Signal
## Signal

- 只读入参绑定，可以指定必传或者可选。
- 内部参数：
	- 可修改参数
- 动态计算参数，基于其他参数计算得到结果，**计算结果为只读的参数**；当其他参数发生变化时，它也会重新进行计算。**计算是 Lazy 的**，只有第一次用到时才会触发**计算并缓存**计算的结果。

``` ts
export class LabelInputComponent {
  // 必传参数
  label = input.required<string>();
  // 可选参数，并提供默认值
  type = input<string>('text')
  // 可修改参数，并提供默认值
  value = signal('');
}
```

参考：
- https://angular.dev/guide/signals

## 模板中引用 Property

通过 `{{ <property-value> }}` 引用 Property 的值，信号通过**圆括号** `<signal-property>()` 来获取值。

``` html
<!-- label-input.component.html -->
<label [id]="label()">{{ label() }}</label>
```
# Event

- 输出事件，父级组件可以订阅组件的输出事件，并感知组件事件的变化并作出处理。
- 事件处理，订阅子组件中的事件，处理事件对自身的影响。

``` ts
export class LabelInputComponent {
  ...
  value = signal('');
  // 输出事件
  onChange = output<string>();
  // 事件处理
  handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
	// 处理完成后，通知订阅方
    this.onChange.emit(target.value);
  }
}
```

``` html
<!-- label-input.component.html -->
...
<input [type]="type()" [value]="value()" (input)="handleInput($event)" />
```

参考：
- https://angular.cn/guide/components/output-fn

# Router

将 page component 配置到路由中。

``` ts
// app.routes.ts
export const routes: Routes = [
  // 首页
  {
    path: '',
    component: AppRootComponent
  },
  ...,
  {
    path: 'surveys',
    component: UserSurveyComponent
  },
  {
    path: 'surveys/:id',
    component: UserSurveyDetailsComponent
  },
  // 如果路由都不匹配，最使用 Not Found 页面
  {
    path: '**',
    component: PageNotFoundComponent
  }
];
```

## 在页面中跳转

一般使用 `RouterLink` 来进行页面跳转。

``` ts
@Component({
  selector: 'app-user-survey',
  // 导入 RouterLink
  imports: [RouterLink],
  templateUrl: './user-survey.component.html',
  styleUrl: './user-survey.component.scss'
})
export class UserSurveyComponent {
}
```

``` html
<!-- user-survey.component.html -->
<a routerLink="/surveys/1">Details</a>
<a [routerLink]="['/surveys', 1]">Details</a>
```
## 获取路由中的参数

``` ts
export class UserSurveyDetailsComponent {
  id: number

  // 通过 ActivatedRoute 去获取路由相关参数
  constructor(private route: ActivatedRoute) {
    this.id = Number(this.route.snapshot.params['id']);
  }
}
```

参考：
- https://angular.cn/guide/routing

# Interface && Service && DI

通过命令 `ng generate interface <路径>` 生成 interface，用于表示数据结构。

``` ts
export interface UserSurvey {
  firstName: string
  lastName?: string
  age: number
}
```

通过命令 `ng generate service <路径>` 生成 service，用于处理复杂的逻辑或者第三方调用。

``` ts
@Injectable({
  providedIn: 'root'
})
export class UserSurveyService {
  getSurvey(id: number): Observable<UserSurvey | undefined> { ... }
}
```

Service 可以通过 DI 注入到 Component 中使用。

``` ts
export class UserSurveyDetailsComponent {
  id: number
  survey: Signal<UserSurvey | undefined>

  // 通过 constructor 注入 service
  constructor(
    private route: ActivatedRoute,
    private userSurveyService: UserSurveyService) {
    this.id = Number(this.route.snapshot.params['id']);
    this.survey = toSignal(this.userSurveyService.getSurvey(this.id))
  }
}
```

参考：
- https://angular.cn/guide/di

# Template

模板文件中除了标准的 HTML && CSS 语法外，还可以使用 Angular 定义的模板语法。

``` html
<!-- user-survey-details.component.html -->
<p>User Survey Details[{{ survey()?.id }}] works!</p>
<div>
  <label for="firstName">firstName: </label>
  <input id="firstName" type="text" [value]="survey()?.firstName ?? ''">
</div>
...
```

参考：
- https://angular.cn/guide/templates

# Form

尽量使用响应式的表单，主要的元素：
- FormGroup，管理相关的 FormControl 列表以及内嵌的 FormGroup 列表
- FormControl，针对每个字段的配置
- FormArray，针对数组字段，每个对象可以是 FormControl 或者是 内嵌的FormGroup

``` ts
export class UserSurveyDetailsComponent {
  ...
  form: Signal<FormGroup>

  constructor(
    private route: ActivatedRoute,
    // 使用 FormBuilder 去创建 FormGroup/FormControl
    private formBuilder: FormBuilder,
    private userSurveyService: UserSurveyService) {
    ...
    // 定义 FormGroup 的结构
    this.form = computed(() => {
      return this.formBuilder.group({
        // 定义每个字段的初始值以及校验规则
        firstName: [this.survey()?.firstName ?? '', Validators.required],
        lastName: [this.survey()?.lastName ?? '', Validators.required],
        age: [this.survey()?.age ?? 0],
      })
    })
  }
}
```

``` html
<!-- user-survey-details.component.html -->
<form [formGroup]="form()">
  ...
  <div>
    <label for="firstName">firstName: </label>
    <input id="firstName" type="text" formControlName="firstName">
  </div>
  ...
  @if (form().valid) {
    <div>valid</div>
  } @else {
    <div>invalid</div>
  }
</form>
```

参考：
- https://angular.cn/guide/forms/reactive-forms

## ControlValueAccessor


# Two-Bind way

参考：
- https://angular.cn/guide/signals/model

# Template


## 生命周期

# Pipe

# Html Ref
